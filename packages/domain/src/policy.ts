import {
  ResidentProfile,
  CredentialSignal,
  LockState,
  AuthorizationEvaluationResult,
  PolicyReasonCode
} from './types.js';

export interface PolicyEvaluationInput {
  resident: ResidentProfile | null;
  credentialSignal?: CredentialSignal | null;
  proximityVerified?: boolean;
  currentLockState: LockState;
  currentTimeMs?: number;
  generateToken?: (residentId: string, durationMs: number) => string;
}

export class AccessPolicyEngine {
  /**
   * Evaluates hands-free and resident entry authorization deterministically.
   * AI/LLM models NEVER directly authorize lock commands.
   */
  public static evaluateEntry(input: PolicyEvaluationInput): AuthorizationEvaluationResult {
    const now = input.currentTimeMs ?? Date.now();
    const { resident, credentialSignal, proximityVerified = true, currentLockState } = input;

    // 1. Check Resident Existence
    if (!resident) {
      return {
        authorized: false,
        reasonCode: 'UNKNOWN_RESIDENT',
        reasonExplanation: 'Resident profile was not found in system records.',
        evaluatedConditions: {
          handsFreeEnabled: false,
          credentialValid: false,
          deviceTrusted: false,
          lockOperational: currentLockState !== 'JAMMED',
          proximityValid: proximityVerified
        }
      };
    }

    // 2. Check Lock Operational State
    if (currentLockState === 'JAMMED') {
      return {
        authorized: false,
        reasonCode: 'LOCK_IS_JAMMED',
        reasonExplanation: 'Physical/Simulated lock mechanism is currently jammed. Manual key intervention required.',
        evaluatedConditions: {
          handsFreeEnabled: resident.handsFreeEntryEnabled,
          credentialValid: false,
          deviceTrusted: false,
          lockOperational: false,
          proximityValid: proximityVerified
        }
      };
    }

    // 3. Check Resident Policy: Is Hands-Free Entry enabled?
    if (!resident.handsFreeEntryEnabled) {
      return {
        authorized: false,
        reasonCode: 'POLICY_HANDS_FREE_DISABLED',
        reasonExplanation: 'Hands-free automatic entry is disabled in resident security settings.',
        evaluatedConditions: {
          handsFreeEnabled: false,
          credentialValid: false,
          deviceTrusted: false,
          lockOperational: true,
          proximityValid: proximityVerified
        }
      };
    }

    // 4. Check Proximity Signal
    if (!proximityVerified) {
      return {
        authorized: false,
        reasonCode: 'PROXIMITY_NOT_VERIFIED',
        reasonExplanation: 'Resident device was not detected within immediate door proximity boundary.',
        evaluatedConditions: {
          handsFreeEnabled: true,
          credentialValid: false,
          deviceTrusted: false,
          lockOperational: true,
          proximityValid: false
        }
      };
    }

    // 5. Check Credential Signal Presence
    if (!credentialSignal) {
      return {
        authorized: false,
        reasonCode: 'INVALID_CREDENTIAL_TOKEN',
        reasonExplanation: 'No authorization credential signal was provided by approaching device.',
        evaluatedConditions: {
          handsFreeEnabled: true,
          credentialValid: false,
          deviceTrusted: false,
          lockOperational: true,
          proximityValid: true
        }
      };
    }

    // 6. Check Credential Expiration
    if (credentialSignal.expiresAt < now) {
      return {
        authorized: false,
        reasonCode: 'EXPIRED_CREDENTIAL_TOKEN',
        reasonExplanation: 'The presented credential signal token has expired.',
        evaluatedConditions: {
          handsFreeEnabled: true,
          credentialValid: false,
          deviceTrusted: false,
          lockOperational: true,
          proximityValid: true
        }
      };
    }

    // 7. Check Trusted Device Match
    const isDeviceTrusted = resident.trustedDeviceIds.includes(credentialSignal.deviceId);
    if (!isDeviceTrusted) {
      return {
        authorized: false,
        reasonCode: 'UNTRUSTED_DEVICE',
        reasonExplanation: `Device ID (${credentialSignal.deviceId}) is not in resident trusted device list.`,
        evaluatedConditions: {
          handsFreeEnabled: true,
          credentialValid: false,
          deviceTrusted: false,
          lockOperational: true,
          proximityValid: true
        }
      };
    }

    // 8. Check Token Validity (simulated token structure check)
    if (!credentialSignal.token || credentialSignal.token.length < 10) {
      return {
        authorized: false,
        reasonCode: 'INVALID_CREDENTIAL_TOKEN',
        reasonExplanation: 'Credential token signature is invalid or malformed.',
        evaluatedConditions: {
          handsFreeEnabled: true,
          credentialValid: false,
          deviceTrusted: true,
          lockOperational: true,
          proximityValid: true
        }
      };
    }

    // All conditions satisfied!
    const tokenGenerator = input.generateToken ?? ((resId: string) => `LOK-AUTH-${resId}-UNLOCK-${now}-${Math.random().toString(36).substring(2, 9)}`);
    const lockCommandToken = tokenGenerator(resident.id, 60000); // 60s validity

    return {
      authorized: true,
      reasonCode: 'AUTHORIZED_HANDS_FREE',
      reasonExplanation: `Entry policy authorized for ${resident.preferredName ?? resident.name}. Credential verified.`,
      evaluatedConditions: {
        handsFreeEnabled: true,
        credentialValid: true,
        deviceTrusted: true,
        lockOperational: true,
        proximityValid: true
      },
      lockCommandToken,
      expiresAt: new Date(now + 60000).toISOString()
    };
  }
}
