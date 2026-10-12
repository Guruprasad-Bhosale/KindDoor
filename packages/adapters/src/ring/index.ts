import crypto from 'node:crypto';
import { DoorEvent, DoorEventType } from '@kinddoor/domain';

export interface RingWebhookVerificationResult {
  isValid: boolean;
  isDuplicate: boolean;
  reason?: string;
}

export class RingWebhookValidator {
  private secret: string;
  private processedEventIds = new Map<string, number>(); // eventId -> timestamp ms
  private maxDriftSeconds = 300; // 5 minutes

  constructor(secret: string = process.env.RING_WEBHOOK_SECRET || 'kinddoor_dev_webhook_signing_secret_2026') {
    this.secret = secret;
  }

  /**
   * Generates a valid HMAC-SHA256 signature for testing or simulator emission.
   */
  public generateSignature(timestamp: number, rawBody: string): string {
    const payload = `${timestamp}.${rawBody}`;
    return crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
  }

  /**
   * Verifies incoming Ring Webhook signature and checks for replay / duplicates.
   */
  public verifyWebhook(
    signature: string | undefined,
    timestampHeader: string | undefined,
    rawBody: string,
    eventId: string
  ): RingWebhookVerificationResult {
    // 1. Signature & Timestamp Presence
    if (!signature || !timestampHeader) {
      return { isValid: false, isDuplicate: false, reason: 'Missing X-Ring-Signature or X-Ring-Timestamp headers' };
    }

    const timestampNum = parseInt(timestampHeader, 10);
    if (isNaN(timestampNum)) {
      return { isValid: false, isDuplicate: false, reason: 'Invalid timestamp header format' };
    }

    // 2. Timestamp Drift Window (Anti-Replay)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > this.maxDriftSeconds) {
      return { isValid: false, isDuplicate: false, reason: `Timestamp drift exceeds ${this.maxDriftSeconds}s window` };
    }

    // 3. Cryptographic Signature Match (with safe buffer length verification)
    const expectedSignature = this.generateSignature(timestampNum, rawBody);
    
    let isValidSignature = false;
    try {
      const sigBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      
      if (sigBuffer.length === expectedBuffer.length && sigBuffer.length > 0) {
        isValidSignature = crypto.timingSafeEqual(sigBuffer, expectedBuffer);
      }
    } catch {
      isValidSignature = false;
    }

    if (!isValidSignature) {
      return { isValid: false, isDuplicate: false, reason: 'HMAC-SHA256 signature mismatch' };
    }

    // 4. Idempotency Check (Duplicate Delivery Deduplication)
    this.purgeStaleEventIds();
    if (this.processedEventIds.has(eventId)) {
      return { isValid: true, isDuplicate: true, reason: 'Duplicate event delivery acknowledged (idempotent)' };
    }

    // Record Event ID in cache
    this.processedEventIds.set(eventId, Date.now());

    return { isValid: true, isDuplicate: false };
  }

  private purgeStaleEventIds(): void {
    const oneHourAgo = Date.now() - 3600000;
    for (const [id, ts] of this.processedEventIds.entries()) {
      if (ts < oneHourAgo) {
        this.processedEventIds.delete(id);
      }
    }
  }
}

export class RingSimulatorAdapter {
  private validator: RingWebhookValidator;

  constructor(validator: RingWebhookValidator) {
    this.validator = validator;
  }

  /**
   * Creates a signed Ring webhook payload for simulation.
   */
  public createSignedWebhookPayload(
    kind: 'ding' | 'motion' | 'doorbot',
    deviceId = 'ring-doorbell-pro-01',
    meta: Record<string, unknown> = {}
  ): { headers: Record<string, string>; body: string; eventId: string } {
    const eventId = `ring-evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyObj = {
      event_id: eventId,
      device_id: deviceId,
      kind,
      state: 'ringing',
      created_at: new Date().toISOString(),
      protocol: 'ring.v2',
      meta
    };
    const bodyStr = JSON.stringify(bodyObj);
    const signature = this.validator.generateSignature(timestamp, bodyStr);

    return {
      headers: {
        'x-ring-signature': signature,
        'x-ring-timestamp': timestamp.toString(),
        'content-type': 'application/json'
      },
      body: bodyStr,
      eventId
    };
  }

  /**
   * Normalizes a raw Ring payload into a KindDoor DoorEvent.
   */
  public normalizeEvent(rawPayload: any): Omit<DoorEvent, 'id' | 'timestamp'> {
    let type: DoorEventType = 'MOTION';
    if (rawPayload.kind === 'ding') type = 'DING';
    if (rawPayload.kind === 'arrival' || rawPayload.meta?.isArrival) type = 'ARRIVAL_SIGNAL';

    return {
      type,
      source: 'RING_DOORBELL',
      opticalConfidence: rawPayload.meta?.opticalConfidence || 'CLEAR_HUMAN',
      syntheticMatchStatus: rawPayload.meta?.syntheticMatchStatus || 'UNCERTAIN',
      rawPayload,
      claimedIdentity: rawPayload.meta?.claimedIdentity
    };
  }
}

export const ringValidatorInstance = new RingWebhookValidator();
export const ringSimulatorInstance = new RingSimulatorAdapter(ringValidatorInstance);
