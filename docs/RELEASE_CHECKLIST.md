# KindDoor Hackathon Release & Submission Checklist
**Amazon Developer Hackathon 2026**

---

## 1. Hackathon Submission Criteria Verification

| Requirement | Verified Status | Evidence / Notes |
| :--- | :---: | :--- |
| **Alexa+ Primary Track** | **COMPLETE** | Self-hosted Streamable HTTP MCP server (`@modelcontextprotocol/sdk` v2025-11-25) exposing 10 tools; web simulation connects via live MCP client. |
| **Ring Primary Track** | **COMPLETE** | Production-aligned Ring webhook ingestion endpoint (`HMAC-SHA256`, timestamp window, deduplication cache) + full-fidelity simulator. |
| **AWS Builder Mini-Challenge** | **COMPLETE** | Amazon Bedrock Converse API (`@aws-sdk/client-bedrock-runtime`) tool-use runtime with deterministic offline fallback. |
| **5 User Scenarios Tested** | **COMPLETE** | Scenarios A, B, C, D, E fully implemented and verified via automated test suites and live UI simulator. |
| **Zero Committed Secrets** | **COMPLETE** | `.gitignore` verified; `.env.example` contains safe placeholders only. |
| **Deterministic Access Security** | **COMPLETE** | AI models cannot actuate lock; all commands evaluated deterministically by `AccessPolicyEngine`. |
| **Simulated Hardware Clearly Labeled** | **COMPLETE** | Smart lock prominently labeled as `SIMULATED LOCK` across all UI views and logs. |
| **WCAG 2.2 AA Accessibility** | **COMPLETE** | Web Speech API audio replay, visual banners, captions, 2-choice patient mode, keyboard shortcuts. |
| **Clean Build & Tests Passing** | **COMPLETE** | 7 test files, 24+ tests passing; Next.js 15 production build exits code 0. |
| **Open Source License** | **COMPLETE** | Apache License 2.0 included in root repository (`LICENSE`). |

---

## 2. Pre-Flight Verification Commands

```bash
# 1. Install & Link Workspace Dependencies
pnpm install

# 2. Synchronize & Seed Database
pnpm --filter @kinddoor/database db:push
pnpm --filter @kinddoor/database db:seed

# 3. Run Automated Unit & Integration Tests
pnpm test

# 4. Compile Production Bundles
pnpm --filter @kinddoor/server build
pnpm --filter @kinddoor/web build

# 5. Launch Development Services
pnpm dev:server   # Fastify & MCP Server (:4000)
pnpm dev:web      # Next.js Web App (:3000)
```
