# KindDoor Secret Handling & Credential Management Policy

## 1. Core Principles
KindDoor enforces a strict zero-leakage security posture across all codebases, tests, client bundles, and documentation:
1. **Zero Committed Secrets**: No API keys, AWS credentials, Ring signing secrets, private keys, database passwords, or JWT secrets are ever committed to Git.
2. **Fail-Closed on Missing Production Security Keys**: Missing cryptographic secrets (e.g. `ACCESS_TOKEN_SECRET`) in production causes server startup to fail immediately rather than using insecure fallback defaults.
3. **Graceful Offline Fallback for Third-Party APIs**: Missing optional external credentials (e.g., AWS Bedrock or Ring live API) degrades gracefully to deterministic offline simulation mode without interrupting developer evaluation.
4. **Client-Server Secret Boundary**: Next.js client bundles are strictly isolated. No server environment variables are exposed through `NEXT_PUBLIC_` prefixes.

---

## 2. Environment Variables & Secret Inventory

| Variable Name | Classification | Required / Optional | Description | Safe Default / Fallback |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Configuration | Required | Server execution environment (`development`, `production`, `test`) | `development` |
| `PORT` | Configuration | Optional | Fastify backend port | `4000` |
| `HOST` | Configuration | Optional | Network binding address | `0.0.0.0` |
| `CORS_ORIGIN` | Security Config | Required | Allowed frontend origin | `http://localhost:3000` |
| `DATABASE_URL` | Database Secret | Required | Connection string for SQLite (`file:./dev.db`) or PostgreSQL | `file:./dev.db` |
| `ACCESS_TOKEN_SECRET` | Cryptographic Key | Required | HMAC key for signing single-use simulated lock tokens | Randomly generated in dev |
| `RING_WEBHOOK_SECRET` | Shared Secret | Optional | HMAC key for validating Ring `X-Ring-Signature` headers | Dev simulator default |
| `RING_API_KEY` | External Secret | Optional | Ring Developer Portal token for live hardware events | Empty (uses simulator) |
| `AWS_REGION` | AWS Config | Optional | AWS target region for Bedrock | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | External Secret | Optional | IAM Access Key for Amazon Bedrock runtime | Empty (uses deterministic engine) |
| `AWS_SECRET_ACCESS_KEY` | External Secret | Optional | IAM Secret Key for Amazon Bedrock runtime | Empty (uses deterministic engine) |
| `AWS_SESSION_TOKEN` | External Secret | Optional | Temporary AWS STS token if using role assumption | Empty |
| `BEDROCK_MODEL_ID` | AI Config | Optional | Amazon Bedrock Converse foundation model | `anthropic.claude-3-haiku-20240307-v1:0` |
| `GEMINI_API_KEY` | External Secret | Optional | Google Gemini API Key for official `@google/genai` SDK | Empty (uses deterministic engine) |
| `GEMINI_MODEL_ID` | AI Config | Optional | Google Gemini foundation model ID | `gemini-2.5-flash` |

---

## 3. Local Development Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. For offline local development, leave `AWS_ACCESS_KEY_ID` and `RING_API_KEY` blank. KindDoor will automatically run in full deterministic simulation mode.
3. For live AWS Bedrock testing:
   - Provide non-root IAM credentials with least-privilege policy allowing `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream`.
   - Never use root AWS account credentials.

---

## 4. Git Precautions & Pre-Commit Verification
- Verify tracked files before committing:
  ```bash
  git status --short
  ```
- Ensure `.env` is never staged:
  ```bash
  git check-ignore -v .env
  ```
- If an environment file is accidentally staged, unstage immediately:
  ```bash
  git restore --staged <file>
  ```

---

## 5. Credential Rotation & Incident Response Plan
If an API key or AWS credential is ever suspected of exposure:
1. **Immediate Revocation**:
   - For AWS: Deactivate the IAM Access Key immediately via AWS IAM Console or AWS CLI (`aws iam update-access-key --status Inactive`).
   - For Ring: Rotate OAuth client secret and regenerate webhook signing secret in Ring Developer Portal.
2. **Audit Access Logs**:
   - Check AWS CloudTrail for unauthorized `bedrock:InvokeModel` calls during the exposure window.
3. **Re-issuance**:
   - Generate fresh credentials, update local `.env` files, and redeploy.
4. **Git History Note**:
   - Note that adding a leaked file to `.gitignore` does not remove it from previous Git commit history. If a commit containing secrets was pushed to a public remote, treat the secret as compromised and rotate it immediately.
