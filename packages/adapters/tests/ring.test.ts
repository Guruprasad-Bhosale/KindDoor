import { describe, it, expect } from 'vitest';
import { RingWebhookValidator, RingSimulatorAdapter } from '../src/ring/index.js';

describe('RingWebhookValidator - HMAC & Idempotency', () => {
  const secret = 'test_webhook_secret_123';
  const validator = new RingWebhookValidator(secret);
  const simulator = new RingSimulatorAdapter(validator);

  it('verifies valid HMAC-SHA256 signature and fresh timestamp', () => {
    const signed = simulator.createSignedWebhookPayload('ding', 'ring-test-01');

    const result = validator.verifyWebhook(
      signed.headers['x-ring-signature'],
      signed.headers['x-ring-timestamp'],
      signed.body,
      signed.eventId
    );

    expect(result.isValid).toBe(true);
    expect(result.isDuplicate).toBe(false);
  });

  it('rejects tampered signature payload', () => {
    const signed = simulator.createSignedWebhookPayload('ding', 'ring-test-01');
    const tamperedBody = signed.body.replace('ding', 'motion');

    const result = validator.verifyWebhook(
      signed.headers['x-ring-signature'],
      signed.headers['x-ring-timestamp'],
      tamperedBody,
      signed.eventId
    );

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('mismatch');
  });

  it('rejects stale timestamp exceeding 300s window (anti-replay)', () => {
    const staleTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
    const body = JSON.stringify({ kind: 'ding' });
    const signature = validator.generateSignature(staleTimestamp, body);

    const result = validator.verifyWebhook(
      signature,
      staleTimestamp.toString(),
      body,
      'stale-event-id'
    );

    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('drift exceeds');
  });

  it('detects duplicate delivery of the same event ID (idempotent)', () => {
    const signed = simulator.createSignedWebhookPayload('ding', 'ring-test-01');

    // First delivery -> Process
    const res1 = validator.verifyWebhook(
      signed.headers['x-ring-signature'],
      signed.headers['x-ring-timestamp'],
      signed.body,
      signed.eventId
    );
    expect(res1.isValid).toBe(true);
    expect(res1.isDuplicate).toBe(false);

    // Second delivery of same eventId -> Acknowledged duplicate
    const res2 = validator.verifyWebhook(
      signed.headers['x-ring-signature'],
      signed.headers['x-ring-timestamp'],
      signed.body,
      signed.eventId
    );
    expect(res2.isValid).toBe(true);
    expect(res2.isDuplicate).toBe(true);
  });
});
