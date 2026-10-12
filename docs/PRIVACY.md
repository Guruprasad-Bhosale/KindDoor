# KindDoor Architectural Privacy & Data Governance Specification

## 1. Zero-Biometric Architecture
- **No Raw Biometrics**: KindDoor does not store facial embeddings, face vectors, voice audio files, or biometric templates.
- **Synthetic Classifications**: Ingress events are classified solely into high-level privacy-preserving labels:
  - `LIKELY_MATCH`: Verified regular visitor in resident directory.
  - `UNVERIFIED_CLAIM`: Visitor stated name with no registered profile.
  - `NO_MATCH`: Unrecognized visitor.

---

## 2. Retention Deadlines & Scheduled Purging
- **Delivery Records**: Retained for 48 hours to confirm package receipt, then flagged for purge.
- **Guest Inquiries**: Retained for 30 days maximum.
- **Purge Execution**: The server provides an automated background sweep and an explicit endpoint (`POST /api/events/purge-expired`) to delete records past their `retentionDeadline`.

---

## 3. Resident Consent Invariant
- **Consent Gate**: Visitor enrollment (`enroll_regular_visitor`) requires affirmative resident authorization (`residentConsentGiven === true`).
- **Auditability**: All enrollment and policy evaluation actions are recorded in the `AuditEvent` database table.
- **Revocation**: Residents can permanently delete any visitor profile via `DELETE /api/resident/visitors/:id`.
