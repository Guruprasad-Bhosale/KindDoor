import { describe, it, expect } from 'vitest';
import { AccessPolicyEngine } from '../src/policy.js';
import { ResidentProfile } from '../src/types.js';

const mockResident: ResidentProfile = {
  id: 'res-eleanor-001',
  name: 'Eleanor Vance',
  preferredName: 'Eleanor',
  handsFreeEntryEnabled: true,
  requiredCredentialTypes: ['BLE_BEACON'],
  trustedDeviceIds: ['phone-eleanor-iphone15', 'watch-eleanor-series9'],
  accessibility: {
    id: 'acc-001',
    residentId: 'res-eleanor-001',
    mode: 'STANDARD',
    spokenFeedbackEnabled: true,
    visualAlertsEnabled: true,
    highContrast: false,
    speechRate: 1.0,
    speechPitch: 1.0,
    binaryChoicesOnly: false,
    autoReplayIntervalSeconds: 0,
    largeText: false
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

describe('AccessPolicyEngine - Deterministic Authorization', () => {
  const now = 1775000000000;

  it('authorizes entry when all conditions pass (Scenario A)', () => {
    const result = AccessPolicyEngine.evaluateEntry({
      resident: mockResident,
      credentialSignal: {
        type: 'BLE_BEACON',
        deviceId: 'phone-eleanor-iphone15',
        token: 'valid_secure_ble_token_xyz_123',
        issuedAt: now - 5000,
        expiresAt: now + 30000
      },
      proximityVerified: true,
      currentLockState: 'LOCKED',
      currentTimeMs: now
    });

    expect(result.authorized).toBe(true);
    expect(result.reasonCode).toBe('AUTHORIZED_HANDS_FREE');
    expect(result.lockCommandToken).toBeDefined();
    expect(result.evaluatedConditions.handsFreeEnabled).toBe(true);
    expect(result.evaluatedConditions.credentialValid).toBe(true);
  });

  it('rejects entry if hands-free entry is disabled', () => {
    const disabledResident: ResidentProfile = {
      ...mockResident,
      handsFreeEntryEnabled: false
    };

    const result = AccessPolicyEngine.evaluateEntry({
      resident: disabledResident,
      credentialSignal: {
        type: 'BLE_BEACON',
        deviceId: 'phone-eleanor-iphone15',
        token: 'valid_secure_ble_token_xyz_123',
        issuedAt: now - 5000,
        expiresAt: now + 30000
      },
      proximityVerified: true,
      currentLockState: 'LOCKED',
      currentTimeMs: now
    });

    expect(result.authorized).toBe(false);
    expect(result.reasonCode).toBe('POLICY_HANDS_FREE_DISABLED');
    expect(result.lockCommandToken).toBeUndefined();
  });

  it('rejects entry if credential token is expired', () => {
    const result = AccessPolicyEngine.evaluateEntry({
      resident: mockResident,
      credentialSignal: {
        type: 'BLE_BEACON',
        deviceId: 'phone-eleanor-iphone15',
        token: 'valid_secure_ble_token_xyz_123',
        issuedAt: now - 60000,
        expiresAt: now - 1000 // Expired!
      },
      proximityVerified: true,
      currentLockState: 'LOCKED',
      currentTimeMs: now
    });

    expect(result.authorized).toBe(false);
    expect(result.reasonCode).toBe('EXPIRED_CREDENTIAL_TOKEN');
  });

  it('rejects entry if device is untrusted (Scenario A Negative Case)', () => {
    const result = AccessPolicyEngine.evaluateEntry({
      resident: mockResident,
      credentialSignal: {
        type: 'BLE_BEACON',
        deviceId: 'unknown-intruder-phone',
        token: 'some_spoofed_token_123456',
        issuedAt: now,
        expiresAt: now + 30000
      },
      proximityVerified: true,
      currentLockState: 'LOCKED',
      currentTimeMs: now
    });

    expect(result.authorized).toBe(false);
    expect(result.reasonCode).toBe('UNTRUSTED_DEVICE');
  });

  it('rejects entry if lock mechanism is jammed', () => {
    const result = AccessPolicyEngine.evaluateEntry({
      resident: mockResident,
      credentialSignal: {
        type: 'BLE_BEACON',
        deviceId: 'phone-eleanor-iphone15',
        token: 'valid_secure_ble_token_xyz_123',
        issuedAt: now,
        expiresAt: now + 30000
      },
      proximityVerified: true,
      currentLockState: 'JAMMED',
      currentTimeMs: now
    });

    expect(result.authorized).toBe(false);
    expect(result.reasonCode).toBe('LOCK_IS_JAMMED');
  });
});
