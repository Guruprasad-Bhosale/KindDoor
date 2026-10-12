import { describe, it, expect, beforeEach } from 'vitest';
import { SimulatedLockAdapter } from '../src/lock/index.js';

describe('SimulatedLockAdapter - Positive Verification & Security Hardening', () => {
  let lock: SimulatedLockAdapter;

  beforeEach(() => {
    lock = new SimulatedLockAdapter();
  });

  it('starts in LOCKED state with isSimulated flag', async () => {
    const status = await lock.getState();
    expect(status.state).toBe('LOCKED');
    expect(status.isSimulated).toBe(true);
  });

  it('unlocks when provided a valid command token bound to resident and action', async () => {
    const token = `LOK-AUTH-res-eleanor-001-UNLOCK-${Date.now()}-xyz789`;
    const result = await lock.requestUnlock('res-eleanor-001', token);

    expect(result.success).toBe(true);
    expect(result.newState).toBe('UNLOCKED');

    const status = await lock.getState();
    expect(status.state).toBe('UNLOCKED');
  });

  it('rejects token bound to a different resident (Isolation violation)', async () => {
    const token = `LOK-AUTH-res-intruder-999-UNLOCK-${Date.now()}-xyz789`;
    const result = await lock.requestUnlock('res-eleanor-001', token);

    expect(result.success).toBe(false);
    expect(result.message).toContain('Token bound to resident');

    const status = await lock.getState();
    expect(status.state).toBe('LOCKED');
  });

  it('rejects token with invalid action (Action binding violation)', async () => {
    const token = `LOK-AUTH-res-eleanor-001-OPEN_WINDOW-${Date.now()}-xyz789`;
    const result = await lock.requestUnlock('res-eleanor-001', token);

    expect(result.success).toBe(false);
    expect(result.message).toContain('not authorized for UNLOCK');
  });

  it('rejects expired command token (> 60s)', async () => {
    const staleTimestamp = Date.now() - 75000; // 75s ago
    const token = `LOK-AUTH-res-eleanor-001-UNLOCK-${staleTimestamp}-xyz789`;
    const result = await lock.requestUnlock('res-eleanor-001', token);

    expect(result.success).toBe(false);
    expect(result.message).toContain('token has expired');
  });

  it('enforces single-use token consumption (anti-replay attack)', async () => {
    const token = `LOK-AUTH-res-eleanor-001-UNLOCK-${Date.now()}-singleuse123`;

    // First unlock succeeds
    const res1 = await lock.requestUnlock('res-eleanor-001', token);
    expect(res1.success).toBe(true);

    // Re-lock
    await lock.lock();

    // Second unlock with same token fails
    const res2 = await lock.requestUnlock('res-eleanor-001', token);
    expect(res2.success).toBe(false);
    expect(res2.message).toContain('already been consumed');
  });

  it('handles simulated mechanical jam failure correctly', async () => {
    lock.simulateFailure('Simulated deadbolt friction');

    const status = await lock.getState();
    expect(status.state).toBe('JAMMED');
    expect(status.jammedReason).toContain('deadbolt friction');

    const token = `LOK-AUTH-res-eleanor-001-UNLOCK-${Date.now()}-xyz789`;
    const result = await lock.requestUnlock('res-eleanor-001', token);
    expect(result.success).toBe(false);
    expect(result.newState).toBe('JAMMED');
  });
});
