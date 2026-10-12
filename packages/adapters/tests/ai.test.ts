import { describe, it, expect } from 'vitest';
import { DeterministicAIAdapter, GeminiAdapter } from '../src/ai/index.js';
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

describe('GeminiAdapter - Configuration, Missing Keys & Error Handling', () => {
  it('handles missing or blank API key gracefully without error', async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const adapterMissing = new GeminiAdapter();
      expect(adapterMissing.getStatus().isConfigured).toBe(false);
      expect(adapterMissing.getStatus().provider).toContain('Google Gemini');

      const adapterEmpty = new GeminiAdapter('');
      expect(adapterEmpty.getStatus().isConfigured).toBe(false);

      const adapterWhitespace = new GeminiAdapter('   ');
      expect(adapterWhitespace.getStatus().isConfigured).toBe(false);

      // Should return null immediately without network calls
      const result = await adapterMissing.runInteraction({
        resident: testResident,
        message: 'Hello',
        executeTool: async () => ({})
      });
      expect(result).toBeNull();
    } finally {
      if (originalKey) {
        process.env.GEMINI_API_KEY = originalKey;
      }
    }
  });

  it('uses configurable model ID with sensible default', () => {
    const adapterDefault = new GeminiAdapter('fake-key');
    expect(adapterDefault.getStatus().modelId).toBe('gemini-2.5-flash');

    const adapterCustom = new GeminiAdapter('fake-key', 'gemini-2.0-flash');
    expect(adapterCustom.getStatus().modelId).toBe('gemini-2.0-flash');
  });

  it('handles successful model responses using mocked SDK client', async () => {
    let capturedParams: any = null;
    const mockClient = {
      models: {
        generateContent: async (params: any) => {
          capturedParams = params;
          return {
            text: 'Hello Eleanor, Maya is at your door with gardening tools.',
            functionCalls: undefined
          };
        }
      }
    };

    const adapter = new GeminiAdapter(undefined, 'gemini-2.5-flash', mockClient);
    expect(adapter.getStatus().isConfigured).toBe(true);

    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Who is at the door?',
      executeTool: async () => ({})
    });

    expect(result).not.toBeNull();
    expect(result?.usedGemini).toBe(true);
    expect(result?.provider).toBe('gemini');
    expect(result?.modelId).toBe('gemini-2.5-flash');
    expect(result?.response).toBe('Hello Eleanor, Maya is at your door with gardening tools.');
    expect(result?.audioAnnouncementText).toBe('Hello Eleanor, Maya is at your door with gardening tools.');
    expect(result?.visualAlertText).toBe('Hello Eleanor, Maya is at your door with gardening tools.');
    // Check patient mode 2 choices
    expect(result?.simplifiedChoices).toHaveLength(2);
    expect(capturedParams.model).toBe('gemini-2.5-flash');
    expect(capturedParams.config.systemInstruction).toContain('KindDoor');
  });

  it('executes structured tool calls and enforces deterministic security separation', async () => {
    const executedTools: Array<{ name: string; args: any }> = [];
    const mockClient = {
      models: {
        generateContent: async () => ({
          text: '',
          functionCalls: [
            { name: 'get_door_context', args: {} },
            { name: 'get_visitor_context', args: { visitorName: 'Maya' } }
          ]
        })
      }
    };

    const adapter = new GeminiAdapter(undefined, 'gemini-2.5-flash', mockClient);
    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Check doorbell status',
      executeTool: async (toolName, args) => {
        executedTools.push({ name: toolName, args });
        if (toolName === 'get_door_context') {
          return { doorState: 'LOCKED' };
        }
        if (toolName === 'get_visitor_context') {
          return { isEnrolled: true, profile: { name: 'Maya' } };
        }
        return {};
      }
    });

    expect(result).not.toBeNull();
    expect(executedTools).toHaveLength(2);
    expect(executedTools[0].name).toBe('get_door_context');
    expect(executedTools[1].name).toBe('get_visitor_context');
    expect(result?.toolsExecuted).toHaveLength(2);
    expect(result?.response).toContain('Completed entry verification actions');
  });

  it('catches API failure safely and returns null to trigger fallback', async () => {
    const mockClient = {
      models: {
        generateContent: async () => {
          throw new Error('429 ResourceExhausted: Quota exceeded for model gemini-2.5-flash');
        }
      }
    };

    const adapter = new GeminiAdapter(undefined, 'gemini-2.5-flash', mockClient);
    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Who is at the door?',
      executeTool: async () => ({})
    });

    // Clean null return enables server-side fallback to deterministic adapter
    expect(result).toBeNull();
  });
});
