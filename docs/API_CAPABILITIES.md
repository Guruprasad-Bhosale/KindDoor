# KindDoor API & Integration Capabilities Matrix

This document provides a truthful, unembellished classification of all KindDoor capabilities, distinguishing between production-ready integrations, simulated hardware adapters, and future Alexa+ developer pathways.

---

## 1. Capability Breakdown & Real vs. Simulated Status

| Capability Area | Implementation Component | Status | Description / Limitations |
| :--- | :--- | :--- | :--- |
| **Model Context Protocol (MCP)** | `apps/server/src/mcp` | **REAL & SELF-HOSTED** | Full Streamable HTTP MCP server using official `@modelcontextprotocol/sdk`. Exposes 10 tools, handles `initialize`, `tools/list`, `tools/call`. Verified against official test suites. |
| **MCP Client Integration** | `apps/web` & `apps/server` | **REAL CLIENT** | Actual MCP client connects via Streamable HTTP, retrieves tools, and dispatches real calls during user & agent interactions. |
| **Ring Webhook Ingestion** | `apps/server/src/routes/ring.ts` | **REAL SPECIFICATION** | Implements official HMAC-SHA256 signature verification (`X-Ring-Signature`), timestamp anti-replay validation (5-minute drift window), and idempotency deduplication cache. |
| **Ring Device Hardware** | `packages/adapters/src/ring` | **REAL + SIMULATOR** | Supports live Ring developer API / Playground credentials when configured via `.env`. Includes full-fidelity `RingSimulatorAdapter` emitting identical normalized event payloads for offline/test evaluation. |
| **Amazon Bedrock AI** | `packages/adapters/src/bedrock` | **REAL AWS INTEGRATION** | Uses `@aws-sdk/client-bedrock-runtime` Converse API (`converse`) with MCP tool mapping. Invoked dynamically when AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`) are supplied. |
| **Deterministic AI Fallback** | `packages/adapters/src/deterministic` | **REAL PRODUCTION FALLBACK** | Standalone deterministic conversational & tool orchestration engine. Runs all 5 scenarios with zero external dependencies when AWS credentials are not configured. |
| **Smart Lock Controller** | `packages/adapters/src/lock` | **SIMULATED (LABELED)** | **Exclusively Simulated**. Explicitly labeled as simulated in all UIs and logs. Enforces deterministic state transitions (`LOCKED`, `UNLOCKING`, `UNLOCKED`, `JAMMED`) and strict policy token verification. Does NOT operate physical hardware. |
| **Hands-Free Proximity Credential** | `packages/adapters/src/identity` | **SIMULATED CREDENTIAL SIGNAL** | Simulates BLE/UWB proximity handshake with cryptographic token validation. Does NOT rely on unassisted biometric/camera signals. |
| **Voice & Speech Synthesis** | `apps/web/src/hooks/useSpeech.ts` | **BROWSER BUILT-IN** | Uses standard W3C Web Speech API (`window.speechSynthesis`) with configurable rate, pitch, voice selection, and visual caption sync. |
| **Alexa+ Service Connection** | Developer Preview | **SIMULATION ONLY** | Hackathon participants cannot access gated Alexa+ developer services; KindDoor provides the officially accepted self-hosted MCP server and web simulation. |

---

## 2. Model Context Protocol (MCP) Tool Definitions

### 1. `get_door_context`
- **Description**: Returns real-time doorbell state, active visitors at door, and latest sensor events.
- **Parameters**: `{}`
- **Returns**: `{ doorState: string, currentVisitor: object | null, recentEvents: DoorEvent[] }`

### 2. `get_resident_preferences`
- **Description**: Returns accessibility and automation preferences for the primary resident.
- **Parameters**: `{ residentId: string }`
- **Returns**: `{ accessibility: object, handsFreeEntry: boolean, requirePin: boolean }`

### 3. `get_visitor_context`
- **Description**: Searches verified regular visitor directory for match confidence.
- **Parameters**: `{ visitorName?: string, syntheticFaceMatchId?: string }`
- **Returns**: `{ isEnrolled: boolean, profile: VisitorProfile | null, confidence: string }`

### 4. `record_visit_purpose`
- **Description**: Temporarily records a visitor's stated identity and purpose.
- **Parameters**: `{ visitId: string, statedName: string, statedPurpose: string, isDelivery: boolean }`
- **Returns**: `{ visitRecordId: string, retentionExpiresAt: string }`

### 5. `create_temporary_visit`
- **Description**: Creates a time-bounded visit session (default 30 min for deliveries/guests).
- **Parameters**: `{ category: 'DELIVERY' | 'SERVICE' | 'GUEST', expectedDurationMinutes: number }`
- **Returns**: `{ visitId: string, expiresAt: string }`

### 6. `request_resident_decision`
- **Description**: Prompts the resident with simplified, accessible binary/multi-choice options.
- **Parameters**: `{ promptText: string, options: string[], urgency: 'LOW' | 'MEDIUM' | 'HIGH' }`
- **Returns**: `{ decisionPromptId: string, timestamp: string }`

### 7. `evaluate_entry_authorization`
- **Description**: Deterministic security engine check against resident rules and credentials.
- **Parameters**: `{ residentId: string, credentialSignal: object, proximityVerified: boolean }`
- **Returns**: `{ authorized: boolean, reasonCode: string, lockCommandToken?: string }`

### 8. `get_lock_status`
- **Description**: Queries verified state from the simulated lock adapter.
- **Parameters**: `{}`
- **Returns**: `{ state: 'LOCKED' | 'UNLOCKED' | 'JAMMED', batteryPct: number, lastStateChange: string }`

### 9. `execute_authorized_entry`
- **Description**: Executes lock unlock ONLY when provided a valid cryptographic policy token.
- **Parameters**: `{ residentId: string, lockCommandToken: string }`
- **Returns**: `{ success: boolean, previousState: string, newState: string }`

### 10. `enroll_regular_visitor`
- **Description**: Enrolls visitor ONLY upon explicit, recorded resident consent.
- **Parameters**: `{ residentId: string, visitorName: string, relationship: string, residentConsentGiven: boolean }`
- **Returns**: `{ visitorProfileId: string, enrolledAt: string }`
