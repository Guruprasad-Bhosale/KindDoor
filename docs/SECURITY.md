# KindDoor Security & Access Policy Architecture

## 1. Security Architecture Principles

KindDoor is engineered around five fundamental application security guarantees:

### 1.1. Separation of AI Reasoning from Access Control
- **Invariant:** Large Language Models (Amazon Bedrock or fallback engines) **CANNOT** directly unlock or actuate any lock mechanism.
- The MCP tool `execute_authorized_entry` requires a cryptographically verifiable or deterministic `lockCommandToken` generated strictly by `evaluate_entry_authorization`.
- Any direct call to `execute_authorized_entry` without a valid token signed within a 60-second validity window is rejected with a `403 FORBIDDEN / INVALID_TOKEN` error.

### 1.2. Ring Webhook Authenticity & Anti-Replay
- All Ring webhook requests MUST provide the `X-Ring-Signature` and `X-Ring-Timestamp` headers.
- Signatures are computed as `HMAC-SHA256(secret, timestamp + "." + rawBody)`.
- Replay prevention:
  - Timestamp drift is bounded to $\pm 300$ seconds (5 minutes).
  - Webhook delivery event IDs are cached in a TTL-bounded LRU deduplication table. Duplicate delivery IDs within 1 hour return `200 OK` (idempotent) with zero duplicate processing side-effects.

### 1.3. Privacy-First Identity & Biometric Safeguards
- **Zero Raw Biometric Storage:** KindDoor does NOT store facial geometry embeddings or raw audio voiceprints.
- Visitor presence is represented exclusively as high-level synthetic classifications: `likely_match`, `unverified_claim`, `unfamiliar_visitor`.
- **Retention Deadlines:** Stated visitor purposes and temporary visit interactions have a strict `retentionExpiresAt` timestamp (default: 48 hours for delivery logs, 30 days for temporary guests).

### 1.4. Consent-Gated Visitor Enrollment
- An LLM cannot autonomously create or approve regular visitor profiles.
- Profile enrollment via `enroll_regular_visitor` requires explicit verification that `residentConsentGiven === true` and generates an immutable audit record in the `AuditEvent` log.

### 1.5. Fail-Safe Simulated Smart Lock Design
- Lock operations implement positive verification: `getState()` is queried after every actuation to confirm the hardware reached the target state (`LOCKED` / `UNLOCKED`).
- If a lock reports `JAMMED` or times out, the system triggers an urgent accessible alert and retains secure default (LOCKED).
- All physical door actuators are strictly simulated and explicitly labeled in UI.

---

## 2. Threat Modeling & Mitigation Matrix

| Threat Vector | Potential Impact | KindDoor Mitigation |
| :--- | :--- | :--- |
| **Prompt Injection Attack** (Visitor speaks malicious instructions into intercom) | Unauthorized unlock or unauthorized enrollment | LLMs have no direct lock tool; `evaluate_entry_authorization` enforces strict credential checks regardless of LLM reasoning output. |
| **Webhook Replay Attack** | False trigger of arrival or ding events | HMAC-SHA256 signature verification + 5-minute timestamp window + Event ID deduplication cache. |
| **Silent Consent Coercion** | Vulnerable resident pressured to unlock | Silence strictly equals refusal (`silence != consent`); simplified binary choices; zero auto-unlock timeouts. |
| **Credential Exfiltration** | Leakage of AWS or Ring API keys | Credentials strictly isolated server-side in `.env`; developer inspector filters out secret tokens. |
| **Stale Authorization Token** | Delayed entry actuation | Lock tokens expire strictly after 60 seconds; single-use token invalidation. |
