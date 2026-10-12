import { describe, it, expect } from 'vitest';
import {
  AccessibilityPreferencesSchema,
  ResidentProfileSchema,
  RingWebhookPayloadSchema,
  EvaluateEntryAuthorizationInputSchema,
  EnrollRegularVisitorInputSchema
} from '../src/index.js';

describe('Validation Schemas (Zod)', () => {
  it('validates AccessibilityPreferencesSchema', () => {
    const valid = {
      id: 'acc-001',
      residentId: 'res-001',
      mode: 'BLIND_LOW_VISION',
      spokenFeedbackEnabled: true,
      visualAlertsEnabled: false,
      highContrast: true,
      speechRate: 1.2,
      speechPitch: 1.0,
      binaryChoicesOnly: false,
      autoReplayIntervalSeconds: 5,
      largeText: true
    };

    const parsed = AccessibilityPreferencesSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('validates RingWebhookPayloadSchema', () => {
    const validPayload = {
      event_id: 'ring-evt-001',
      device_id: 'ring-doorbell-01',
      kind: 'ding',
      created_at: new Date().toISOString()
    };

    const parsed = RingWebhookPayloadSchema.safeParse(validPayload);
    expect(parsed.success).toBe(true);
  });

  it('validates EvaluateEntryAuthorizationInputSchema', () => {
    const valid = {
      residentId: 'res-eleanor-001',
      credentialSignal: {
        type: 'BLE_BEACON',
        deviceId: 'phone-01',
        token: 'token-abc',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 60000
      },
      proximityVerified: true
    };

    const parsed = EvaluateEntryAuthorizationInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('validates EnrollRegularVisitorInputSchema requiring explicit resident consent', () => {
    const valid = {
      residentId: 'res-eleanor-001',
      visitorName: 'John Doe',
      relationship: 'FRIEND',
      notes: 'Family friend',
      residentConsentGiven: true
    };

    const parsed = EnrollRegularVisitorInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });
});
