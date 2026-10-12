import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';
import { AccessPolicyEngine } from '@kinddoor/domain';
import {
  getPrimaryResident,
  getEnrolledVisitors,
  findVisitorByName,
  getRecentDoorEvents,
  recordDoorEvent,
  logAuditEvent,
  prisma
} from '@kinddoor/database';
import { lockAdapterInstance } from '@kinddoor/adapters';

export function createKindDoorMcpServer() {
  const server = new McpServer({
    name: 'KindDoor-MCP-Server',
    version: '1.0.0'
  });

  // 1. Tool: get_door_context
  server.tool(
    'get_door_context',
    'Returns real-time doorbell state, active visitors at door, optical sensor confidence, and lock state',
    {},
    async () => {
      const lockStatus = await lockAdapterInstance.getState();
      const recentEvents = await getRecentDoorEvents(5);
      const latestEvent = recentEvents[0] || null;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              doorState: lockStatus.state,
              lockStatus,
              latestEvent,
              recentEventsCount: recentEvents.length,
              timestamp: new Date().toISOString()
            })
          }
        ]
      };
    }
  );

  // 2. Tool: get_resident_preferences
  server.tool(
    'get_resident_preferences',
    'Returns accessibility and automation preferences for the primary resident',
    {
      residentId: z.string().describe('The resident unique identifier')
    },
    async ({ residentId }) => {
      const resident = await getPrimaryResident();
      if (!resident) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ error: 'Resident not found' }) }],
          isError: true
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              residentId: resident.id,
              name: resident.name,
              preferredName: resident.preferredName,
              handsFreeEntryEnabled: resident.handsFreeEntryEnabled,
              trustedDeviceIds: resident.trustedDeviceIds,
              accessibility: resident.accessibility
            })
          }
        ]
      };
    }
  );

  // 3. Tool: get_visitor_context
  server.tool(
    'get_visitor_context',
    'Searches verified regular visitor directory for match confidence',
    {
      visitorName: z.string().optional().describe('Name claimed or observed of visitor')
    },
    async ({ visitorName }) => {
      const resident = await getPrimaryResident();
      if (!resident) {
        return {
          content: [{ type: 'text', text: JSON.stringify({ isEnrolled: false, reason: 'No resident' }) }]
        };
      }

      if (visitorName) {
        const match = await findVisitorByName(visitorName);
        if (match) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  isEnrolled: true,
                  profile: match,
                  confidence: 'LIKELY_MATCH'
                })
              }
            ]
          };
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              isEnrolled: false,
              profile: null,
              confidence: 'NO_MATCH',
              notice: 'Unverified visitor claim. Stated identity must be verified before granting regular access.'
            })
          }
        ]
      };
    }
  );

  // 4. Tool: record_visit_purpose
  server.tool(
    'record_visit_purpose',
    'Temporarily records a visitor stated identity and purpose with an automated retention deadline',
    {
      visitId: z.string().describe('Unique visit interaction ID'),
      statedName: z.string().describe('Visitor claimed name'),
      statedPurpose: z.string().describe('Visitor stated purpose for visit'),
      isDelivery: z.boolean().default(false).describe('Whether this is a parcel/goods delivery'),
      deliveryCompany: z.string().optional().describe('Courier company name if delivery')
    },
    async ({ visitId, statedName, statedPurpose, isDelivery, deliveryCompany }) => {
      const retentionExpiresAt = new Date(Date.now() + (isDelivery ? 48 * 3600000 : 30 * 24 * 3600000)).toISOString();

      await logAuditEvent('MCP_AGENT', 'VISITOR_PURPOSE_RECORDED', {
        visitId,
        statedName,
        statedPurpose,
        isDelivery,
        retentionExpiresAt
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              visitRecordId: visitId,
              statedName,
              statedPurpose,
              isDelivery,
              deliveryCompany,
              retentionExpiresAt,
              recordedAt: new Date().toISOString()
            })
          }
        ]
      };
    }
  );

  // 5. Tool: create_temporary_visit
  server.tool(
    'create_temporary_visit',
    'Creates a time-bounded temporary visit session for deliveries or temporary guests',
    {
      category: z.enum(['DELIVERY', 'SERVICE', 'GUEST']).describe('Visit category'),
      expectedDurationMinutes: z.number().min(1).max(1440).describe('Duration in minutes')
    },
    async ({ category, expectedDurationMinutes }) => {
      const visitId = `visit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const expiresAt = new Date(Date.now() + expectedDurationMinutes * 60000).toISOString();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              visitId,
              category,
              expectedDurationMinutes,
              expiresAt,
              status: 'ACTIVE'
            })
          }
        ]
      };
    }
  );

  // 6. Tool: request_resident_decision
  server.tool(
    'request_resident_decision',
    'Prompts the resident with simplified, accessible binary or multi-choice options',
    {
      promptText: z.string().describe('Question or decision prompt to present to resident'),
      options: z.array(z.string()).min(2).max(4).describe('List of accessible choice buttons'),
      urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM').describe('Urgency level')
    },
    async ({ promptText, options, urgency }) => {
      const decisionPromptId = `dec-${Date.now()}`;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              decisionPromptId,
              promptText,
              options,
              urgency,
              presentedAt: new Date().toISOString()
            })
          }
        ]
      };
    }
  );

  // 7. Tool: evaluate_entry_authorization
  server.tool(
    'evaluate_entry_authorization',
    'Deterministic security engine check against resident entry policy and credential signal',
    {
      residentId: z.string().describe('Resident ID'),
      credentialSignal: z
        .object({
          type: z.enum(['BLE_BEACON', 'PIN_CODE', 'INTENT_SIGNAL']),
          deviceId: z.string(),
          token: z.string(),
          issuedAt: z.number(),
          expiresAt: z.number()
        })
        .optional()
        .nullable(),
      proximityVerified: z.boolean().default(true).describe('Whether resident device is in direct door proximity')
    },
    async ({ residentId, credentialSignal, proximityVerified }) => {
      const resident = await getPrimaryResident();
      const lockStatus = await lockAdapterInstance.getState();

      const evaluation = AccessPolicyEngine.evaluateEntry({
        resident: resident?.id === residentId ? resident : null,
        credentialSignal: credentialSignal || undefined,
        proximityVerified,
        currentLockState: lockStatus.state
      });

      // Audit policy evaluation
      await logAuditEvent('SYSTEM_POLICY', 'POLICY_EVALUATION', {
        residentId,
        authorized: evaluation.authorized,
        reasonCode: evaluation.reasonCode,
        evaluatedConditions: evaluation.evaluatedConditions
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(evaluation)
          }
        ]
      };
    }
  );

  // 8. Tool: get_lock_status
  server.tool(
    'get_lock_status',
    'Queries verified state from the simulated lock adapter',
    {},
    async () => {
      const status = await lockAdapterInstance.getState();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status)
          }
        ]
      };
    }
  );

  // 9. Tool: execute_authorized_entry
  server.tool(
    'execute_authorized_entry',
    'Executes lock unlock operation ONLY when provided a valid cryptographic policy token',
    {
      residentId: z.string().describe('Target resident ID'),
      lockCommandToken: z.string().describe('Cryptographic command token produced by evaluate_entry_authorization')
    },
    async ({ residentId, lockCommandToken }) => {
      const result = await lockAdapterInstance.requestUnlock(residentId, lockCommandToken);

      await logAuditEvent('LOCK_COMMAND', result.success ? 'UNLOCK_SUCCESS' : 'UNLOCK_REJECTED', {
        residentId,
        result
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result)
          }
        ]
      };
    }
  );

  // 10. Tool: enroll_regular_visitor
  server.tool(
    'enroll_regular_visitor',
    'Enrolls regular visitor profile ONLY upon explicit, recorded resident consent',
    {
      residentId: z.string().describe('Resident granting enrollment'),
      visitorName: z.string().describe('Full name of regular visitor'),
      relationship: z.enum(['FAMILY', 'FRIEND', 'NEIGHBOR', 'CAREGIVER', 'DELIVERY', 'SERVICE', 'UNKNOWN']),
      notes: z.string().optional().describe('Optional context or schedule notes'),
      residentConsentGiven: z.boolean().describe('Explicit confirmation of resident consent')
    },
    async ({ residentId, visitorName, relationship, notes, residentConsentGiven }) => {
      if (!residentConsentGiven) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: 'Consent verification failed: residentConsentGiven must be explicitly true.'
              })
            }
          ],
          isError: true
        };
      }

      const consentRecordId = `consent-${residentId}-${Date.now()}`;
      const newProfile = await prisma.visitorProfile.create({
        data: {
          id: `vis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          residentId,
          name: visitorName,
          relationship,
          notes: notes || 'Enrolled with resident consent',
          syntheticMatchLabel: `likely_match_${visitorName.toLowerCase().replace(/\s+/g, '_')}`,
          status: 'ENROLLED_REGULAR',
          consentRecordId
        }
      });

      await logAuditEvent('RESIDENT', 'VISITOR_ENROLLED', {
        residentId,
        visitorName,
        relationship,
        consentRecordId
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              visitorProfile: newProfile,
              consentRecordId,
              message: `Visitor ${visitorName} successfully enrolled with resident consent.`
            })
          }
        ]
      };
    }
  );

  return server;
}
