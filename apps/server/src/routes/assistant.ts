import { FastifyPluginAsync } from 'fastify';
import {
  getPrimaryResident,
  getEnrolledVisitors,
  findVisitorByName,
  getRecentDoorEvents,
  logAuditEvent,
  prisma
} from '@kinddoor/database';
import {
  bedrockAdapterInstance,
  geminiAdapterInstance,
  DeterministicAIAdapter,
  lockAdapterInstance
} from '@kinddoor/adapters';
import { AccessPolicyEngine } from '@kinddoor/domain';

export const assistantRoutes: FastifyPluginAsync = async (fastify) => {
  // Execute an MCP tool directly via server context
  const executeMcpTool = async (toolName: string, args: Record<string, any>) => {
    switch (toolName) {
      case 'get_door_context': {
        const lockStatus = await lockAdapterInstance.getState();
        const recentEvents = await getRecentDoorEvents(5);
        return {
          doorState: lockStatus.state,
          lockStatus,
          latestEvent: recentEvents[0] || null,
          timestamp: new Date().toISOString()
        };
      }
      case 'get_resident_preferences': {
        const resident = await getPrimaryResident();
        return {
          residentId: resident?.id,
          name: resident?.name,
          preferredName: resident?.preferredName,
          handsFreeEntryEnabled: resident?.handsFreeEntryEnabled,
          accessibility: resident?.accessibility
        };
      }
      case 'get_visitor_context': {
        const name = args.visitorName;
        if (name) {
          const match = await findVisitorByName(name);
          if (match) {
            return { isEnrolled: true, profile: match, confidence: 'LIKELY_MATCH' };
          }
        }
        return { isEnrolled: false, profile: null, confidence: 'NO_MATCH' };
      }
      case 'record_visit_purpose': {
        const retentionExpiresAt = new Date(Date.now() + (args.isDelivery ? 48 * 3600000 : 30 * 24 * 3600000)).toISOString();
        await logAuditEvent('MCP_AGENT', 'VISITOR_PURPOSE_RECORDED', { ...args, retentionExpiresAt });
        return {
          visitRecordId: args.visitId || `visit-${Date.now()}`,
          statedName: args.statedName,
          statedPurpose: args.statedPurpose,
          isDelivery: args.isDelivery,
          retentionExpiresAt
        };
      }
      case 'create_temporary_visit': {
        const visitId = `visit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        return {
          visitId,
          category: args.category || 'GUEST',
          expectedDurationMinutes: args.expectedDurationMinutes || 30,
          expiresAt: new Date(Date.now() + (args.expectedDurationMinutes || 30) * 60000).toISOString()
        };
      }
      case 'request_resident_decision': {
        return {
          decisionPromptId: `dec-${Date.now()}`,
          promptText: args.promptText,
          options: args.options,
          presentedAt: new Date().toISOString()
        };
      }
      case 'evaluate_entry_authorization': {
        const resident = await getPrimaryResident();
        const lockStatus = await lockAdapterInstance.getState();
        const evalResult = AccessPolicyEngine.evaluateEntry({
          resident: resident?.id === args.residentId ? resident : null,
          credentialSignal: args.credentialSignal,
          proximityVerified: args.proximityVerified ?? true,
          currentLockState: lockStatus.state
        });
        await logAuditEvent('SYSTEM_POLICY', 'POLICY_EVALUATION', {
          residentId: args.residentId,
          authorized: evalResult.authorized,
          reasonCode: evalResult.reasonCode
        });
        return evalResult;
      }
      case 'get_lock_status': {
        return lockAdapterInstance.getState();
      }
      case 'execute_authorized_entry': {
        const result = await lockAdapterInstance.requestUnlock(args.residentId, args.lockCommandToken);
        await logAuditEvent('LOCK_COMMAND', result.success ? 'UNLOCK_SUCCESS' : 'UNLOCK_REJECTED', {
          residentId: args.residentId,
          result
        });
        return result;
      }
      case 'enroll_regular_visitor': {
        if (!args.residentConsentGiven) {
          throw new Error('Consent verification failed');
        }
        const consentRecordId = `consent-${args.residentId}-${Date.now()}`;
        const newProfile = await prisma.visitorProfile.create({
          data: {
            id: `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            residentId: args.residentId,
            name: args.visitorName,
            relationship: args.relationship || 'FRIEND',
            notes: args.notes || 'Enrolled via resident consent',
            syntheticMatchLabel: `likely_match_${args.visitorName.toLowerCase().replace(/\s+/g, '_')}`,
            status: 'ENROLLED_REGULAR',
            consentRecordId
          }
        });
        await logAuditEvent('RESIDENT', 'VISITOR_ENROLLED', {
          residentId: args.residentId,
          visitorName: args.visitorName,
          consentRecordId
        });
        return { success: true, visitorProfile: newProfile, consentRecordId };
      }
      default:
        throw new Error(`Unknown MCP tool: ${toolName}`);
    }
  };

  // Assistant Interaction Endpoint
  fastify.post('/api/assistant/interact', async (request, reply) => {
    const { message, scenarioId, conversationHistory } = (request.body || {}) as any;

    const resident = await getPrimaryResident();
    if (!resident) {
      return reply.status(404).send({ error: 'Resident not found' });
    }

    const input = {
      resident,
      message: message || 'Who is at the door?',
      scenarioId,
      conversationHistory,
      executeTool: executeMcpTool
    };

    // Provider hierarchy: Gemini (if configured) -> Bedrock (if configured) -> Deterministic Fallback
    const geminiStatus = geminiAdapterInstance.getStatus();
    const bedrockStatus = bedrockAdapterInstance.getStatus();
    const selectedProvider: 'gemini' | 'bedrock' | 'deterministic' = geminiStatus.isConfigured
      ? 'gemini'
      : bedrockStatus.isConfigured
      ? 'bedrock'
      : 'deterministic';

    let outcome: any = null;
    if (geminiStatus.isConfigured) {
      outcome = await geminiAdapterInstance.runInteraction(input);
    }
    if (!outcome && bedrockStatus.isConfigured) {
      outcome = await bedrockAdapterInstance.runConverse(input);
    }
    if (!outcome) {
      outcome = await DeterministicAIAdapter.interact(input);
    }

    const actualProvider: 'gemini' | 'bedrock' | 'deterministic' =
      outcome.provider || (outcome.usedGemini ? 'gemini' : outcome.usedBedrock ? 'bedrock' : 'deterministic');
    const fallbackActive = actualProvider !== selectedProvider;
    const fallbackStatus: 'NONE' | 'FALLBACK_ACTIVATED' = fallbackActive ? 'FALLBACK_ACTIVATED' : 'NONE';
    const lastGeminiMeta = geminiAdapterInstance.getLastInferenceMetadata();

    const retryCount =
      outcome.retryCount !== undefined
        ? outcome.retryCount
        : selectedProvider === 'gemini'
        ? (lastGeminiMeta?.retryCount ?? 0)
        : 0;

    const errorCategory =
      outcome.errorCategory ||
      (fallbackActive && selectedProvider === 'gemini' ? lastGeminiMeta?.errorCategory : undefined);

    const sanitizedDiagnostic =
      outcome.sanitizedDiagnostic ||
      (fallbackActive && selectedProvider === 'gemini' ? lastGeminiMeta?.sanitizedDiagnostic : undefined);

    const metadata = {
      selectedProvider,
      actualProvider,
      fallbackActive,
      fallbackStatus,
      retryCount,
      maxRetries: 2,
      errorCategory,
      sanitizedDiagnostic,
      modelId:
        outcome.modelId ||
        (actualProvider === 'gemini'
          ? geminiStatus.modelId
          : actualProvider === 'bedrock'
          ? bedrockStatus.modelId
          : undefined)
    };

    outcome.selectedProvider = selectedProvider;
    outcome.actualProvider = actualProvider;
    outcome.fallbackActive = fallbackActive;
    outcome.fallbackStatus = fallbackStatus;
    outcome.retryCount = retryCount;
    outcome.errorCategory = errorCategory;
    outcome.sanitizedDiagnostic = sanitizedDiagnostic;
    outcome.metadata = metadata;

    await logAuditEvent('MCP_AGENT', 'ASSISTANT_INTERACTION', {
      scenarioId,
      provider: actualProvider,
      selectedProvider,
      actualProvider,
      fallbackActive,
      fallbackStatus,
      retryCount,
      errorCategory,
      sanitizedDiagnostic,
      usedBedrock: outcome.usedBedrock,
      usedGemini: outcome.usedGemini ?? false,
      modelId: outcome.modelId,
      toolsCount: outcome.toolsExecuted.length
    });

    return reply.status(200).send(outcome);
  });
};
