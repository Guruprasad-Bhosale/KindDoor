export type AccessibilityMode = 'STANDARD' | 'BLIND_LOW_VISION' | 'DEAF_HARD_OF_HEARING' | 'PATIENT_SIMPLIFIED';

export interface AccessibilityPreferences {
  id: string;
  residentId: string;
  mode: AccessibilityMode;
  spokenFeedbackEnabled: boolean;
  visualAlertsEnabled: boolean;
  highContrast: boolean;
  speechRate: number; // 0.5 to 2.0 (default 1.0)
  speechPitch: number; // 0.5 to 1.5 (default 1.0)
  binaryChoicesOnly: boolean; // For patient mode: 2 simple options
  autoReplayIntervalSeconds: number; // 0 = disabled
  largeText: boolean;
}

export interface ResidentProfile {
  id: string;
  name: string;
  preferredName?: string;
  handsFreeEntryEnabled: boolean;
  requiredCredentialTypes: ('BLE_BEACON' | 'PIN_CODE' | 'INTENT_SIGNAL')[];
  pinHash?: string;
  trustedDeviceIds: string[];
  accessibility: AccessibilityPreferences;
  createdAt: string;
  updatedAt: string;
}

export type VisitorRelationship = 'FAMILY' | 'FRIEND' | 'NEIGHBOR' | 'CAREGIVER' | 'DELIVERY' | 'SERVICE' | 'UNKNOWN';

export interface VisitorProfile {
  id: string;
  residentId: string;
  name: string;
  relationship: VisitorRelationship;
  notes?: string;
  syntheticMatchLabel?: string;
  enrolledAt: string;
  consentRecordId: string;
  status: 'ENROLLED_REGULAR' | 'TEMPORARY_GUEST' | 'DELIVERY_SERVICE';
}

export interface StatedVisitorClaim {
  statedName: string;
  statedPurpose: string;
  isDelivery: boolean;
  deliveryCompany?: string;
  timestamp: string;
  retentionExpiresAt: string;
}

export type DoorEventType = 'MOTION' | 'DING' | 'ARRIVAL_SIGNAL' | 'INTERACTION_START' | 'INTERACTION_END';

export interface DoorEvent {
  id: string;
  type: DoorEventType;
  source: 'RING_DOORBELL' | 'RING_CAMERA' | 'PROXIMITY_SENSOR' | 'SIMULATOR';
  timestamp: string;
  rawPayload?: Record<string, unknown>;
  opticalConfidence?: 'CLEAR_HUMAN' | 'VEHICLE' | 'PACKAGE' | 'UNKNOWN';
  claimedIdentity?: StatedVisitorClaim;
  verifiedVisitorId?: string;
  syntheticMatchStatus?: 'LIKELY_MATCH' | 'NO_MATCH' | 'UNCERTAIN';
}

export type LockState = 'LOCKED' | 'UNLOCKING' | 'UNLOCKED' | 'LOCKING' | 'JAMMED';

export interface LockStatus {
  state: LockState;
  batteryPct: number;
  isSimulated: true;
  lastStateChange: string;
  jammedReason?: string;
}

export interface CredentialSignal {
  type: 'BLE_BEACON' | 'PIN_CODE' | 'INTENT_SIGNAL';
  deviceId: string;
  token: string;
  issuedAt: number; // Unix timestamp ms
  expiresAt: number;
}

export interface AuthorizationEvaluationResult {
  authorized: boolean;
  reasonCode: PolicyReasonCode;
  reasonExplanation: string;
  evaluatedConditions: {
    handsFreeEnabled: boolean;
    credentialValid: boolean;
    deviceTrusted: boolean;
    lockOperational: boolean;
    proximityValid: boolean;
  };
  lockCommandToken?: string;
  expiresAt?: string;
}

export type PolicyReasonCode =
  | 'AUTHORIZED_HANDS_FREE'
  | 'POLICY_HANDS_FREE_DISABLED'
  | 'INVALID_CREDENTIAL_TOKEN'
  | 'EXPIRED_CREDENTIAL_TOKEN'
  | 'UNTRUSTED_DEVICE'
  | 'LOCK_IS_JAMMED'
  | 'PROXIMITY_NOT_VERIFIED'
  | 'UNKNOWN_RESIDENT';

export interface VisitSession {
  id: string;
  doorEventId: string;
  visitorClaim?: StatedVisitorClaim;
  matchedVisitorId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'ADMITTED' | 'DECLINED' | 'COMPLETED' | 'TIMEOUT';
  startTime: string;
  endTime?: string;
  retentionDeadline: string;
}

export interface AuditEvent {
  id: string;
  eventType: 'LOCK_COMMAND' | 'POLICY_EVALUATION' | 'CONSENT_GRANTED' | 'VISITOR_ENROLLED' | 'WEBHOOK_RECEIVED';
  timestamp: string;
  actor: 'RESIDENT' | 'SYSTEM_POLICY' | 'MCP_AGENT' | 'RING_WEBHOOK';
  details: Record<string, unknown>;
  ipOrSource?: string;
}
