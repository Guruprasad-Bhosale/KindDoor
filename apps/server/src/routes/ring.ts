import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  ringValidatorInstance,
  ringSimulatorInstance,
  lockAdapterInstance
} from '@kinddoor/adapters';
import {
  recordDoorEvent,
  logAuditEvent,
  getPrimaryResident,
  getRecentDoorEvents
} from '@kinddoor/database';

export const ringRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // 1. Production Ring Webhook Ingestion Endpoint
  fastify.post('/api/ring/webhook', async (request, reply) => {
    const rawBody = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    const signature = request.headers['x-ring-signature'] as string | undefined;
    const timestamp = request.headers['x-ring-timestamp'] as string | undefined;
    const bodyObj = (request.body || {}) as any;
    const eventId = bodyObj.event_id || `evt-raw-${Date.now()}`;

    // Verify HMAC-SHA256 signature and timestamp anti-replay window
    const verification = ringValidatorInstance.verifyWebhook(signature, timestamp, rawBody, eventId);

    if (!verification.isValid) {
      await logAuditEvent('RING_WEBHOOK', 'WEBHOOK_REJECTED', {
        reason: verification.reason,
        signatureProvided: !!signature,
        timestampProvided: !!timestamp
      });
      return reply.status(401).send({ error: 'Unauthorized Ring Webhook', reason: verification.reason });
    }

    if (verification.isDuplicate) {
      // Idempotent 200 OK without processing duplicate side-effects
      return reply.status(200).send({ status: 'ACKNOWLEDGED_DUPLICATE', event_id: eventId });
    }

    // Normalize and persist valid event
    const normalized = ringSimulatorInstance.normalizeEvent(bodyObj);
    const recorded = await recordDoorEvent({
      id: eventId,
      ...normalized
    });

    await logAuditEvent('RING_WEBHOOK', 'WEBHOOK_PROCESSED', {
      eventId: recorded.id,
      type: recorded.type,
      kind: bodyObj.kind
    });

    return reply.status(200).send({
      status: 'PROCESSED',
      event: recorded
    });
  });

  // 2. Simulator Trigger Endpoint (Allows web app to trigger realistic events)
  fastify.post('/api/simulator/trigger', async (request, reply) => {
    const { scenario, eventType, visitorName, purpose, isDelivery } = (request.body || {}) as any;

    let kind: 'ding' | 'motion' | 'doorbot' = 'ding';
    if (eventType === 'MOTION') kind = 'motion';

    const meta: Record<string, unknown> = {
      scenario,
      opticalConfidence: 'CLEAR_HUMAN',
      claimedIdentity: visitorName
        ? {
            statedName: visitorName,
            statedPurpose: purpose || 'Friendly visit',
            isDelivery: !!isDelivery,
            timestamp: new Date().toISOString(),
            retentionExpiresAt: new Date(Date.now() + 86400000).toISOString()
          }
        : undefined
    };

    // Generate signed Ring payload through simulator
    const signedPayload = ringSimulatorInstance.createSignedWebhookPayload(kind, 'ring-doorbell-pro-01', meta);

    // Ingest into internal webhook pipeline
    const verification = ringValidatorInstance.verifyWebhook(
      signedPayload.headers['x-ring-signature'],
      signedPayload.headers['x-ring-timestamp'],
      signedPayload.body,
      signedPayload.eventId
    );

    const normalized = ringSimulatorInstance.normalizeEvent(JSON.parse(signedPayload.body));
    const recorded = await recordDoorEvent({
      id: signedPayload.eventId,
      ...normalized
    });

    await logAuditEvent('SYSTEM_POLICY', 'SIMULATOR_EVENT_TRIGGERED', {
      scenario,
      eventId: recorded.id,
      type: recorded.type
    });

    return reply.status(200).send({
      success: true,
      scenario,
      event: recorded,
      signedHeaders: signedPayload.headers
    });
  });
};
