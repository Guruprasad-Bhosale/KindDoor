# KindDoor Comprehensive Test Plan

## 1. Scope & Strategy
KindDoor employs a multi-tiered test suite across unit, integration, protocol, and end-to-end accessibility layers:
1. **Domain & Policy Engine Unit Tests**: Deterministic validation of all positive/negative authorization permutations.
2. **MCP Protocol Integration Tests**: Verification of Streamable HTTP handshake, JSON-RPC 2.0 schema, tool listing, and tool invocation using the official MCP SDK client.
3. **Ring Ingestion Tests**: HMAC-SHA256 signature verification, anti-replay window rejection, and event deduplication.
4. **Bedrock & Fallback Adapter Tests**: Structured tool-call loop testing with real/mock Bedrock runtime and deterministic engine parity.
5. **Simulated Lock Adapter Tests**: State transitions, failure/jam handling, and single-use token enforcement.

---

## 2. Test Suites Summary

| Test File | Target Subsystem | Key Assertions |
| :--- | :--- | :--- |
| `packages/domain/tests/policy.test.ts` | Policy Engine | - Authorizes when hands-free enabled + valid BLE token.<br>- Rejects when token is invalid or expired.<br>- Rejects when hands-free is disabled.<br>- Rejects when lock is jammed. |
| `packages/adapters/tests/ring.test.ts` | Ring Adapter | - Validates correct HMAC-SHA256 signature.<br>- Rejects timestamp drift > 300s.<br>- Ignores duplicate webhook delivery IDs.<br>- Normalizes DING and MOTION events. |
| `apps/server/tests/mcp.test.ts` | MCP Server | - Handles `initialize` with protocol version negotiation.<br>- Lists 10 required tools with valid schemas.<br>- Executes `evaluate_entry_authorization` & `get_door_context`. |
| `packages/adapters/tests/lock.test.ts` | Lock Adapter | - Transitions from LOCKED -> UNLOCKING -> UNLOCKED.<br>- Fails unlock without valid token.<br>- Properly reports and recovers from simulated JAM state. |
| `packages/adapters/tests/ai.test.ts` | AI Orchestrator | - Invokes Bedrock Converse tool loop or falls back cleanly.<br>- Never exposes direct lock actuation to LLM prompts. |

---

## 3. Test Execution Commands

```bash
# Run all workspace test suites
pnpm test

# Run specific package tests
pnpm --filter @kinddoor/domain test
pnpm --filter @kinddoor/adapters test
pnpm --filter @kinddoor/server test
```
