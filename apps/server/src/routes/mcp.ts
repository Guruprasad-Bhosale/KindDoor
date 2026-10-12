import { FastifyPluginAsync } from 'fastify';
import { bedrockAdapterInstance, geminiAdapterInstance, lockAdapterInstance } from '@kinddoor/adapters';

export const mcpRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /api/mcp/status - Developer Inspector MCP status & tools
  fastify.get('/api/mcp/status', async (request, reply) => {
    const bedrock = bedrockAdapterInstance.getStatus();
    const gemini = geminiAdapterInstance.getStatus();
    const lock = await lockAdapterInstance.getState();

    const tools = [
      {
        name: 'get_door_context',
        description: 'Returns real-time doorbell state, active visitors at door, and sensor metadata',
        parameters: {}
      },
      {
        name: 'get_resident_preferences',
        description: 'Returns accessibility and automation preferences for the primary resident',
        parameters: { residentId: 'string (required)' }
      },
      {
        name: 'get_visitor_context',
        description: 'Searches verified regular visitor directory for match confidence',
        parameters: { visitorName: 'string (optional)' }
      },
      {
        name: 'record_visit_purpose',
        description: 'Temporarily records a visitor stated identity and purpose with retention deadline',
        parameters: { visitId: 'string', statedName: 'string', statedPurpose: 'string', isDelivery: 'boolean' }
      },
      {
        name: 'create_temporary_visit',
        description: 'Creates a time-bounded temporary visit session for deliveries or temporary guests',
        parameters: { category: 'DELIVERY | SERVICE | GUEST', expectedDurationMinutes: 'number' }
      },
      {
        name: 'request_resident_decision',
        description: 'Prompts the resident with simplified, accessible binary or multi-choice options',
        parameters: { promptText: 'string', options: 'string[]', urgency: 'LOW | MEDIUM | HIGH' }
      },
      {
        name: 'evaluate_entry_authorization',
        description: 'Deterministic security engine check against resident entry policy and credentials',
        parameters: { residentId: 'string', credentialSignal: 'object', proximityVerified: 'boolean' }
      },
      {
        name: 'get_lock_status',
        description: 'Queries verified state from the simulated lock adapter',
        parameters: {}
      },
      {
        name: 'execute_authorized_entry',
        description: 'Executes lock unlock operation ONLY when provided a valid cryptographic policy token',
        parameters: { residentId: 'string', lockCommandToken: 'string' }
      },
      {
        name: 'enroll_regular_visitor',
        description: 'Enrolls regular visitor profile ONLY upon explicit, recorded resident consent',
        parameters: { residentId: 'string', visitorName: 'string', relationship: 'string', residentConsentGiven: 'boolean' }
      }
    ];

    return reply.status(200).send({
      protocol: 'modelcontextprotocol',
      version: '2025-11-25',
      transport: 'Streamable HTTP / SSE',
      serverName: 'KindDoor-MCP-Server',
      status: 'CONNECTED',
      activeToolsCount: tools.length,
      tools,
      bedrockStatus: {
        isConfigured: bedrock.isConfigured,
        modelId: bedrock.modelId,
        region: bedrock.region,
        runtime: bedrock.isConfigured ? 'Amazon Bedrock Runtime (Converse API)' : 'Deterministic AI Engine (Offline Fallback)'
      },
      geminiStatus: {
        isConfigured: gemini.isConfigured,
        status: gemini.status,
        probeStatus: gemini.probeStatus,
        inferenceStatus: gemini.inferenceStatus,
        fallbackActive: gemini.fallbackActive,
        modelId: gemini.modelId,
        runtime: gemini.isConfigured ? 'Google Gen AI SDK (@google/genai)' : 'Deterministic AI Engine (Offline Fallback)',
        provider: gemini.provider,
        lastError: gemini.lastError || null,
        lastTestedAt: gemini.lastTestedAt || null,
        lastInferenceAt: gemini.lastInferenceAt || null,
        lastInferenceMetadata: gemini.lastInferenceMetadata || null
      },
      lockStatus: lock
    });
  });

  // POST /api/mcp/gemini/test - Trigger an on-demand safe connection probe
  fastify.post('/api/mcp/gemini/test', async (request, reply) => {
    const probeResult = await geminiAdapterInstance.testConnection();
    return reply.status(200).send(probeResult);
  });
};
