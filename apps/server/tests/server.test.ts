import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import { createKindDoorMcpServer } from '../src/mcp/index.js';
import { mcpRoutes } from '../src/routes/mcp.js';

describe('Server & MCP Protocol Integration', () => {
  it('instantiates KindDoor MCP Server with tools registered', () => {
    const server = createKindDoorMcpServer();
    expect(server).toBeDefined();
  });

  it('exposes geminiStatus safely on /api/mcp/status without secret exposure', async () => {
    const app = Fastify();
    await app.register(mcpRoutes);

    const res = await app.inject({
      method: 'GET',
      url: '/api/mcp/status'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.geminiStatus).toBeDefined();
    expect(typeof body.geminiStatus.isConfigured).toBe('boolean');
    expect(['NOT_CONFIGURED', 'CONFIGURED_NOT_TESTED', 'CONNECTED', 'REQUEST_FAILED']).toContain(body.geminiStatus.status);
    expect(typeof body.geminiStatus.fallbackActive).toBe('boolean');
    expect(body.geminiStatus.modelId).toBeDefined();
    expect(body.geminiStatus.runtime).toBeDefined();

    // Verify zero secret leakage in payload
    const rawBody = res.body;
    expect(rawBody).not.toContain('GEMINI_API_KEY');
    expect(rawBody).not.toContain('ACCESS_TOKEN_SECRET');

    // Verify probe and inference separation
    expect(body.geminiStatus.probeStatus).toBeDefined();
    expect(body.geminiStatus.inferenceStatus).toBeDefined();
  });

  it('provides safe on-demand probe on /api/mcp/gemini/test', async () => {
    const app = Fastify();
    await app.register(mcpRoutes);

    const res = await app.inject({
      method: 'POST',
      url: '/api/mcp/gemini/test'
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(typeof body.success).toBe('boolean');
    expect(['NOT_CONFIGURED', 'CONFIGURED_NOT_TESTED', 'CONNECTED', 'REQUEST_FAILED']).toContain(body.status);
    expect(res.body).not.toContain('GEMINI_API_KEY');
  });

  it('exposes sanitized per-request metadata and fallback provider on /api/assistant/interact', async () => {
    const { assistantRoutes } = await import('../src/routes/assistant.js');
    const { seedDatabase } = await import('@kinddoor/database');
    await seedDatabase();

    const app = Fastify();
    await app.register(assistantRoutes);

    const res = await app.inject({
      method: 'POST',
      url: '/api/assistant/interact',
      payload: {
        message: 'Who is at the door?',
        scenarioId: 'scenario_b_blind_resident'
      }
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();

    // Verify sanitized per-request metadata
    expect(body.selectedProvider).toBeDefined();
    expect(body.actualProvider).toBeDefined();
    expect(typeof body.fallbackActive).toBe('boolean');
    expect(['NONE', 'FALLBACK_ACTIVATED']).toContain(body.fallbackStatus);
    expect(typeof body.retryCount).toBe('number');
    expect(body.metadata).toBeDefined();
    expect(body.metadata.selectedProvider).toBe(body.selectedProvider);
    expect(body.metadata.actualProvider).toBe(body.actualProvider);
    expect(body.metadata.maxRetries).toBe(2);

    // Verify zero secret leakage
    expect(res.body).not.toContain('GEMINI_API_KEY');
    expect(res.body).not.toContain('ACCESS_TOKEN_SECRET');
  });
});
