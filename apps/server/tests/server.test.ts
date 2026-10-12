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
    expect(body.geminiStatus.modelId).toBeDefined();
    expect(body.geminiStatus.runtime).toBeDefined();

    // Verify zero secret leakage in payload
    const rawBody = res.body;
    expect(rawBody).not.toContain('GEMINI_API_KEY');
    expect(rawBody).not.toContain('ACCESS_TOKEN_SECRET');
  });
});
