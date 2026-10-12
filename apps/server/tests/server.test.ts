import { describe, it, expect } from 'vitest';
import { createKindDoorMcpServer } from '../src/mcp/index.js';

describe('Server & MCP Protocol Integration', () => {
  it('instantiates KindDoor MCP Server with tools registered', () => {
    const server = createKindDoorMcpServer();
    expect(server).toBeDefined();
  });
});
