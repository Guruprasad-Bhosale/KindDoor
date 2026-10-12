import { describe, it, expect } from 'vitest';
import { DeterministicAIAdapter } from '../src/ai/index.js';
import { ResidentProfile } from '@kinddoor/domain';

const testResident: ResidentProfile = {
  id: 'res-eleanor-001',
  name: 'Eleanor Vance',
  preferredName: 'Eleanor',
  handsFreeEntryEnabled: true,
  requiredCredentialTypes: ['BLE_BEACON'],
  trustedDeviceIds: ['phone-eleanor-iphone15'],
  accessibility: {
    id: 'acc-001',
    residentId: 'res-eleanor-001',
    mode: 'PATIENT_SIMPLIFIED',
    spokenFeedbackEnabled: true,
    visualAlertsEnabled: true,
    highContrast: false,
    speechRate: 1.0,
    speechPitch: 1.0,
    binaryChoicesOnly: true,
    autoReplayIntervalSeconds: 0,
    largeText: false
  },
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z'
};

describe('DeterministicAIAdapter - Scenario Orchesration', () => {
  it('executes Scenario A (hands-free arrival) with tool execution', async () => {
    const executedTools: string[] = [];
    const result = await DeterministicAIAdapter.interact({
      resident: testResident,
      scenarioId: 'scenario_a_groceries',
      message: 'Arriving with groceries',
      executeTool: async (toolName, args) => {
        executedTools.push(toolName);
        if (toolName === 'evaluate_entry_authorization') {
          return {
            authorized: true,
            reasonCode: 'AUTHORIZED_HANDS_FREE',
            lockCommandToken: 'LOK-AUTH-test-token-xyz'
          };
        }
        if (toolName === 'execute_authorized_entry') {
          return { success: true, newState: 'UNLOCKED' };
        }
        if (toolName === 'get_lock_status') {
          return { state: 'UNLOCKED', isSimulated: true };
        }
        return {};
      }
    });

    expect(executedTools).toContain('evaluate_entry_authorization');
    expect(executedTools).toContain('execute_authorized_entry');
    expect(result.response).toContain('unlocked');
    expect(result.visualAlertText).toContain('Door Unlocked');
  });

  it('executes Scenario D with simplified 2-choice output for confused resident', async () => {
    const result = await DeterministicAIAdapter.interact({
      resident: testResident,
      scenarioId: 'scenario_d_patient_assistance',
      message: "I don't understand",
      executeTool: async () => ({})
    });

    expect(result.simplifiedChoices).toBeDefined();
    expect(result.simplifiedChoices?.length).toBe(2);
    expect(result.response).toContain('Mark may be here to visit');
  });
});
