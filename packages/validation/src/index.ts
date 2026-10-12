import { z } from 'zod';

// ==========================================
// 1. Accessibility & Resident Schemas
// ==========================================

export const AccessibilityModeSchema = z.enum([
  'STANDARD',
  'BLIND_LOW_VISION',
  'DEAF_HARD_OF_HEARING',
  'PATIENT_SIMPLIFIED'
]);

export const AccessibilityPreferencesSchema = z.object({
  id: z.string().min(1),
  residentId: z.string().min(1),
  mode: AccessibilityModeSchema,
  spokenFeedbackEnabled: z.boolean().default(true),
  visualAlertsEnabled: z.boolean().default(true),
  highContrast: z.boolean().default(false),
  speechRate: z.number().min(0.5).max(2.0).default(1.0),
  speechPitch: z.number().min(0.5).max(1.5).default(1.0),
  binaryChoicesOnly: z.boolean().default(false),
  autoReplayIntervalSeconds: z.number().min(0).default(0),
  largeText: z.boolean().default(false)
});

export const UpdateAccessibilityPreferencesSchema = AccessibilityPreferencesSchema.partial().omit({
  id: true,
  residentId: true
});

export const ResidentProfileSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  preferredName: z.string().optional(),
  handsFreeEntryEnabled: z.boolean().default(true),
  requiredCredentialTypes: z.array(z.enum(['BLE_BEACON', 'PIN_CODE', 'INTENT_SIGNAL'])).default(['BLE_BEACON']),
  pinHash: z.string().optional(),
  trustedDeviceIds: z.array(z.string()).default([]),
  accessibility: AccessibilityPreferencesSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

// ==========================================
// 2. Visitor & Visit Schemas
// ==========================================

export const VisitorRelationshipSchema = z.enum([
  'FAMILY',
  'FRIEND',
  'NEIGHBOR',
  'CAREGIVER',
  'DELIVERY',
  'SERVICE',
  'UNKNOWN'
]);

export const VisitorProfileSchema = z.object({
  id: z.string().min(1),
  residentId: z.string().min(1),
  name: z.string().min(1),
  relationship: VisitorRelationshipSchema,
  notes: z.string().optional(),
  syntheticMatchLabel: z.string().optional(),
  enrolledAt: z.string().datetime(),
  consentRecordId: z.string().min(1),
  status: z.enum(['ENROLLED_REGULAR', 'TEMPORARY_GUEST', 'DELIVERY_SERVICE'])
});

export const StatedVisitorClaimSchema = z.object({
  statedName: z.string().min(1),
  statedPurpose: z.string().min(1),
  isDelivery: z.boolean().default(false),
  deliveryCompany: z.string().optional(),
  timestamp: z.string().datetime(),
  retentionExpiresAt: z.string().datetime()
});

// ==========================================
// 3. Ring Webhook & Event Schemas
// ==========================================

export const RingWebhookPayloadSchema = z.object({
  event_id: z.string().min(1),
  device_id: z.string().min(1),
  kind: z.enum(['ding', 'motion', 'on_demand', 'doorbot']),
  state: z.string().optional(),
  created_at: z.string().or(z.number()),
  protocol: z.string().optional(),
  meta: z.record(z.unknown()).optional()
});

export const DoorEventTypeSchema = z.enum([
  'MOTION',
  'DING',
  'ARRIVAL_SIGNAL',
  'INTERACTION_START',
  'INTERACTION_END'
]);

export const DoorEventSchema = z.object({
  id: z.string().min(1),
  type: DoorEventTypeSchema,
  source: z.enum(['RING_DOORBELL', 'RING_CAMERA', 'PROXIMITY_SENSOR', 'SIMULATOR']),
  timestamp: z.string().datetime(),
  rawPayload: z.record(z.unknown()).optional(),
  opticalConfidence: z.enum(['CLEAR_HUMAN', 'VEHICLE', 'PACKAGE', 'UNKNOWN']).optional(),
  claimedIdentity: StatedVisitorClaimSchema.optional(),
  verifiedVisitorId: z.string().optional(),
  syntheticMatchStatus: z.enum(['LIKELY_MATCH', 'NO_MATCH', 'UNCERTAIN']).optional()
});

// ==========================================
// 4. Lock & Credential Schemas
// ==========================================

export const LockStateSchema = z.enum(['LOCKED', 'UNLOCKING', 'UNLOCKED', 'LOCKING', 'JAMMED']);

export const LockStatusSchema = z.object({
  state: LockStateSchema,
  batteryPct: z.number().min(0).max(100),
  isSimulated: z.literal(true),
  lastStateChange: z.string().datetime(),
  jammedReason: z.string().optional()
});

export const CredentialSignalSchema = z.object({
  type: z.enum(['BLE_BEACON', 'PIN_CODE', 'INTENT_SIGNAL']),
  deviceId: z.string().min(1),
  token: z.string().min(1),
  issuedAt: z.number(),
  expiresAt: z.number()
});

// ==========================================
// 5. MCP Tool Input & Output Schemas
// ==========================================

export const GetDoorContextInputSchema = z.object({}).strict();
export const GetResidentPreferencesInputSchema = z.object({
  residentId: z.string().min(1)
});

export const GetVisitorContextInputSchema = z.object({
  visitorName: z.string().optional(),
  syntheticFaceMatchId: z.string().optional()
});

export const RecordVisitPurposeInputSchema = z.object({
  visitId: z.string().min(1),
  statedName: z.string().min(1),
  statedPurpose: z.string().min(1),
  isDelivery: z.boolean().default(false),
  deliveryCompany: z.string().optional()
});

export const CreateTemporaryVisitInputSchema = z.object({
  category: z.enum(['DELIVERY', 'SERVICE', 'GUEST']).default('GUEST'),
  expectedDurationMinutes: z.number().min(1).max(1440).default(30)
});

export const RequestResidentDecisionInputSchema = z.object({
  promptText: z.string().min(1),
  options: z.array(z.string().min(1)).min(2).max(4),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM')
});

export const EvaluateEntryAuthorizationInputSchema = z.object({
  residentId: z.string().min(1),
  credentialSignal: CredentialSignalSchema.optional().nullable(),
  proximityVerified: z.boolean().default(true)
});

export const GetLockStatusInputSchema = z.object({}).strict();

export const ExecuteAuthorizedEntryInputSchema = z.object({
  residentId: z.string().min(1),
  lockCommandToken: z.string().min(1)
});

export const EnrollRegularVisitorInputSchema = z.object({
  residentId: z.string().min(1),
  visitorName: z.string().min(1),
  relationship: VisitorRelationshipSchema,
  notes: z.string().optional(),
  residentConsentGiven: z.boolean()
});

// ==========================================
// 6. Assistant Chat / Orchestration Schemas
// ==========================================

export const AssistantMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string()
});

export const AssistantInteractionRequestSchema = z.object({
  residentId: z.string().min(1),
  scenarioId: z.string().optional(),
  message: z.string().min(1),
  conversationHistory: z.array(AssistantMessageSchema).default([])
});

// ==========================================
// 7. Environment Validation Schema
// ==========================================

export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().or(z.number()).default(4000),
  HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ACCESS_TOKEN_SECRET: z.string().min(16, 'ACCESS_TOKEN_SECRET must be at least 16 chars').default('kinddoor_secure_lock_token_hmac_secret_2026'),
  RING_WEBHOOK_SECRET: z.string().default('kinddoor_dev_webhook_signing_secret_2026'),
  RING_API_KEY: z.string().optional().default(''),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_SESSION_TOKEN: z.string().optional().default(''),
  BEDROCK_MODEL_ID: z.string().default('anthropic.claude-3-haiku-20240307-v1:0'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL_ID: z.string().default('gemini-2.5-flash')
});
export type ServerEnv = z.infer<typeof ServerEnvSchema>;

