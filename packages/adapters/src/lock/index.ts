import { LockState, LockStatus } from '@kinddoor/domain';

export interface LockAdapter {
  getState(): Promise<LockStatus>;
  requestUnlock(residentId: string, token: string): Promise<{ success: boolean; newState: LockState; message: string }>;
  lock(): Promise<{ success: boolean; newState: LockState }>;
  simulateFailure(reason?: string): void;
  reset(): void;
}

export class SimulatedLockAdapter implements LockAdapter {
  private currentState: LockState = 'LOCKED';
  private batteryPct = 94;
  private lastStateChange: string = new Date().toISOString();
  private isJammed = false;
  private jamReason?: string;
  private consumedTokens = new Set<string>();

  public async getState(): Promise<LockStatus> {
    return {
      state: this.currentState,
      batteryPct: this.batteryPct,
      isSimulated: true,
      lastStateChange: this.lastStateChange,
      jammedReason: this.isJammed ? this.jamReason : undefined
    };
  }

  /**
   * Unlocks the door ONLY if provided a valid, unconsumed policy token matching resident and action.
   */
  public async requestUnlock(
    residentId: string,
    token: string
  ): Promise<{ success: boolean; newState: LockState; message: string }> {
    if (this.isJammed) {
      return {
        success: false,
        newState: 'JAMMED',
        message: `Simulated lock is jammed: ${this.jamReason || 'Mechanical obstruction detected'}`
      };
    }

    if (!token || !token.startsWith('LOK-AUTH-')) {
      return {
        success: false,
        newState: this.currentState,
        message: 'Security policy violation: Invalid lock authorization command token format.'
      };
    }

    // Parse Token Pattern: LOK-AUTH-{residentId}-{action}-{timestamp}-{random}
    const match = token.match(/^LOK-AUTH-(.+)-([A-Z_]+)-(\d+)-([a-zA-Z0-9]+)$/);
    if (!match) {
      return {
        success: false,
        newState: this.currentState,
        message: 'Security policy violation: Malformed lock authorization token structure.'
      };
    }

    const [, tokenResidentId, tokenAction, timestampStr] = match;
    const tokenTimestamp = parseInt(timestampStr, 10);

    // 1. Resident ID Binding Check
    if (tokenResidentId !== residentId) {
      return {
        success: false,
        newState: this.currentState,
        message: `Security policy violation: Token bound to resident (${tokenResidentId}) cannot be used by (${residentId}).`
      };
    }

    // 2. Action Binding Check
    if (tokenAction !== 'UNLOCK') {
      return {
        success: false,
        newState: this.currentState,
        message: `Security policy violation: Token action (${tokenAction}) is not authorized for UNLOCK.`
      };
    }

    // 3. Expiration Check (60s validity window)
    const now = Date.now();
    if (!isNaN(tokenTimestamp) && now - tokenTimestamp > 60000) {
      return {
        success: false,
        newState: this.currentState,
        message: 'Security policy violation: Lock authorization command token has expired.'
      };
    }

    if (this.consumedTokens.has(token)) {
      return {
        success: false,
        newState: this.currentState,
        message: 'Security policy violation: Authorization token has already been consumed (single-use anti-replay).'
      };
    }

    // Mark single-use token consumed
    this.consumedTokens.add(token);

    // Simulate transition
    this.currentState = 'UNLOCKING';
    await new Promise((resolve) => setTimeout(resolve, 300));

    this.currentState = 'UNLOCKED';
    this.lastStateChange = new Date().toISOString();

    return {
      success: true,
      newState: 'UNLOCKED',
      message: `Simulated front door lock successfully unlocked for resident ${residentId}.`
    };
  }

  public async lock(): Promise<{ success: boolean; newState: LockState }> {
    if (this.isJammed) {
      return { success: false, newState: 'JAMMED' };
    }
    this.currentState = 'LOCKED';
    this.lastStateChange = new Date().toISOString();
    return { success: true, newState: 'LOCKED' };
  }

  public simulateFailure(reason = 'Bolt obstruction / mechanical jam'): void {
    this.isJammed = true;
    this.jamReason = reason;
    this.currentState = 'JAMMED';
    this.lastStateChange = new Date().toISOString();
  }

  public reset(): void {
    this.isJammed = false;
    this.jamReason = undefined;
    this.currentState = 'LOCKED';
    this.consumedTokens.clear();
    this.lastStateChange = new Date().toISOString();
  }
}

export const lockAdapterInstance = new SimulatedLockAdapter();
