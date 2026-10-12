# KindDoor — Adaptive, Accessible, Secure Home Entry Agent
**Amazon Developer Hackathon 2026**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Protocol](https://img.shields.io/badge/MCP-2025--11--25-amber.svg)](https://modelcontextprotocol.io)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG_2.2_AA-green.svg)](docs/WORKFLOWS.md)

> *"The front door that adapts to you."*

KindDoor is an accessibility-first home entry intelligence system engineered for the **Amazon Developer Hackathon 2026**. It connects intelligent entry hardware, conversational agent interfaces, and diverse physical/cognitive human needs without sacrificing security.

---

## 🎯 Target Hackathon Tracks & Capabilities

1. **Alexa+ Primary Track**:
   - **Self-Hosted MCP Server**: Built using the official `@modelcontextprotocol/sdk` exposing 10 tools over Streamable HTTP (`2025-11-25`).
   - **Polished Alexa+-Style Simulation**: Live web interface connected to an actual MCP client executing real tool calls and wire diagnostics.
2. **Ring Primary Track**:
   - **Ring Ingestion Pipeline**: Production-aligned webhook endpoint with HMAC-SHA256 signature verification (`X-Ring-Signature`), timestamp anti-replay window, and idempotency deduplication cache.
   - **Full-Fidelity Simulator**: Emits identical normalized Ring event payloads for offline/test evaluation.
3. **AWS Builder Mini-Challenge**:
   - **Amazon Bedrock Converse Integration**: Dynamic tool-use orchestration using `@aws-sdk/client-bedrock-runtime`.
   - **Deterministic Fallback Engine**: Fully offline scenario-aware fallback that guarantees 100% demo functionality without AWS credentials.

---

## 🔒 Critical Safety & Security Invariants

1. **Deterministic Access Control Separation**: AI models (Bedrock or fallback LLMs) **NEVER** directly command the lock. All entry requests pass through the deterministic `AccessPolicyEngine`, which verifies credentials, resident policy, and proximity independently.
2. **Strictly Simulated Lock**: All smart lock operations are labeled as simulated.
3. **Privacy by Design**: No raw facial embeddings or voiceprints stored. Visitor claims are strictly distinguished from verified directory profiles.
4. **Consent-Gated Enrollment**: New regular visitors can only be enrolled upon explicit resident confirmation.
5. **Silence Never Equals Consent**: The system never auto-unlocks upon timeout or resident silence.

---

## 📁 Repository Structure

```text
kinddoor/
├── apps/
│   ├── web/               # Next.js 15 App Router, Tailwind CSS, Web Speech API
│   └── server/            # Fastify, Streamable HTTP MCP Server, Ring & Bedrock Routes
├── packages/
│   ├── domain/            # Domain models, AccessPolicyEngine, Reason codes
│   ├── validation/        # Shared Zod schemas for all models & tools
│   ├── database/          # Prisma ORM schema, SQLite/PostgreSQL, Seeder
│   └── adapters/          # Ring HMAC validator, Simulated Lock, Bedrock & Fallback AI
├── docs/
│   ├── ARCHITECTURE.md    # System design & Mermaid sequence diagrams
│   ├── API_CAPABILITIES.md# Real vs Simulated capability matrix
│   ├── WORKFLOWS.md       # Detailed 5-scenario execution flows
│   ├── SECURITY.md        # Threat modeling & security invariants
│   ├── TEST_PLAN.md       # Test matrix & coverage details
│   ├── DEMO_SCRIPT.md     # Step-by-step judge walkthrough
│   └── HACKATHON_RESOURCES.md # Official guides & resources consulted
├── docker-compose.yml     # Optional local PostgreSQL container
├── .env.example           # Environment template (Zero committed secrets)
└── LICENSE                # Apache-2.0 Open-Source License
```

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- **Node.js**: `v20+` or `v24+` (Installed: `v24.20.0`)
- **pnpm**: `v9+` or `v12+` (Installed: `v12.3.4`)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Initialize Database & Seed Synthetic Data
```bash
# Push Prisma schema and seed resident/visitor profiles
pnpm --filter @kinddoor/database db:push
pnpm --filter @kinddoor/database db:seed
```

### 4. Run Automated Test Suites
```bash
pnpm test
```

### 5. Start Development Servers
In two terminal tabs:

**Terminal 1 — Backend & MCP Server (Port 4000):**
```bash
pnpm dev:server
```

**Terminal 2 — Web Application (Port 3000):**
```bash
pnpm dev:web
```

Open **`http://localhost:3000`** in Google Chrome or Microsoft Edge (to enable Web Speech API).

---

## 🎬 5-Scenario Interactive Demo Walkthrough

Navigate to the **Scenario Simulator** tab on the web application:

| Scenario | Objective | Key Verification |
| :--- | :--- | :--- |
| **Scenario A: Hands-Free Arrival** | Resident Eleanor arrives with groceries | Policy checks BLE signal; MCP executes unlock; speaks welcome. Negative test keeps lock locked. |
| **Scenario B: Blind / Low-Vision** | Neighbor Maya rings doorbell | Speaks visitor name & purpose via Web Speech API; press `[Space]` to repeat, `[1]` to speak. |
| **Scenario C: Deaf / Hard-of-Hearing** | Amazon Courier delivers package | High-contrast visual flash banner, live captions, zero audio required. |
| **Scenario D: Patient Assistance** | Caregiver Mark visits older resident | Simplifies confusion into 2 clear binary buttons (A / B); silence never unlocks. |
| **Scenario E: Unfamiliar Visitor** | Visitor John claims family friendship | Distinguishes stated claim from verified record; requires explicit consent checkbox to enroll. |

---

## 🧪 Real MCP Wire Protocol & Developer Inspector

Navigate to the **Developer Inspector** tab:
- **MCP Connection**: Shows active Streamable HTTP connection on version `2025-11-25`.
- **Tool Discovery**: Live listing of all 10 registered MCP tools with JSON parameters.
- **Hardware Fault Injection**: Click *"Simulate Jam"* to test lock failure recovery.
- **Ring Ingestion**: Verifies HMAC-SHA256 signatures and timestamp window rejection.
- **Bedrock / Fallback Status**: Live indicator showing active AI runtime.

---

## 📜 License
Licensed under the [Apache License, Version 2.0](LICENSE).
