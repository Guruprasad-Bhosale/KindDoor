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

  it('uses configurable model ID with sensible default gemini-3.8-flash', () => {
    const adapterDefault = new GeminiAdapter('fake-key');
    expect(adapterDefault.getStatus().modelId).toBe('gemini-3.8-flash');

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

    const adapter = new GeminiAdapter(undefined, 'gemini-3.8-flash', mockClient);
    expect(adapter.getStatus().isConfigured).toBe(true);
    expect(adapter.getStatus().status).toBe('CONFIGURED_NOT_TESTED');

    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Who is at the door?',
      executeTool: async () => ({})
    });

    expect(result).not.toBeNull();
    expect(result?.usedGemini).toBe(true);
    expect(result?.provider).toBe('gemini');
    expect(result?.modelId).toBe('gemini-3.8-flash');
    expect(result?.response).toBe('Hello Eleanor, Maya is at your door with gardening tools.');
    expect(result?.audioAnnouncementText).toBe('Hello Eleanor, Maya is at your door with gardening tools.');
    expect(result?.visualAlertText).toBe('Hello Eleanor, Maya is at your door with gardening tools.');
    // Check patient mode 2 choices
    expect(result?.simplifiedChoices).toHaveLength(2);
    expect(capturedParams.model).toBe('gemini-3.8-flash');
    expect(capturedParams.config.systemInstruction).toContain('KindDoor');

    // After successful inference, status must transition to CONNECTED
    expect(adapter.getStatus().status).toBe('CONNECTED');
    expect(adapter.getStatus().fallbackActive).toBe(false);
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

    const adapter = new GeminiAdapter(undefined, 'gemini-3.8-flash', mockClient);
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

  it('catches API failure safely, updates status to REQUEST_FAILED, and returns null', async () => {
    let callCount = 0;
    const mockClient = {
      models: {
        generateContent: async () => {
          callCount++;
          throw new Error('429 ResourceExhausted: Quota exceeded for model gemini-3.8-flash');
        }
      }
    };

    // Use fast retry delays for testing
    const adapter = new GeminiAdapter(undefined, 'gemini-3.8-flash', mockClient, { initialDelayMs: 1, jitterMs: 0 });
    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Who is at the door?',
      executeTool: async () => ({})
    });

    // Clean null return enables server-side fallback to deterministic adapter
    expect(result).toBeNull();
    expect(callCount).toBe(3); // 1 initial + 2 retries
    expect(adapter.getStatus().status).toBe('REQUEST_FAILED');
    expect(adapter.getStatus().inferenceStatus).toBe('REQUEST_FAILED');
    expect(adapter.getStatus().fallbackActive).toBe(true);
    expect(adapter.getStatus().lastError).toContain('429 ResourceExhausted');
    expect(adapter.getLastInferenceMetadata()?.retryCount).toBe(2);
    expect(adapter.getLastInferenceMetadata()?.errorCategory).toBe('RATE_LIMIT');
  });

  it('retries transient 503 UNAVAILABLE with exponential backoff and succeeds on retry', async () => {
    let callCount = 0;
    let toolExecutionCount = 0;
    const mockClient = {
      models: {
        generateContent: async () => {
          callCount++;
          if (callCount === 1) {
            // First call fails with temporary 503 high demand
            const err: any = new Error('503 UNAVAILABLE: The model is overloaded. Please try again later.');
            err.status = 503;
            throw err;
          }
          // Second call succeeds!
          return {
            text: 'Hello Eleanor, Maya is at your door.',
            functionCalls: [{ name: 'get_door_context', args: {} }]
          };
        }
      }
    };

    const adapter = new GeminiAdapter(undefined, 'gemini-3.8-flash', mockClient, { initialDelayMs: 1, jitterMs: 0 });
    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Who is at the door?',
      executeTool: async () => {
        toolExecutionCount++;
        return { doorState: 'LOCKED' };
      }
    });

    expect(result).not.toBeNull();
    expect(callCount).toBe(2); // 1 failure + 1 success
    expect(toolExecutionCount).toBe(1); // Tool executed ONLY ONCE on successful inference (zero duplicate tools)
    expect(result?.usedGemini).toBe(true);
    expect(result?.actualProvider).toBe('gemini');
    expect(result?.selectedProvider).toBe('gemini');
    expect(result?.fallbackActive).toBe(false);
    expect(result?.fallbackStatus).toBe('NONE');
    expect(result?.retryCount).toBe(1);
    expect(adapter.getStatus().status).toBe('CONNECTED');
    expect(adapter.getStatus().inferenceStatus).toBe('CONNECTED');
  });

  it('exhausts at most 2 retries on persistent transient 503 and records sanitized metadata', async () => {
    let callCount = 0;
    let toolExecutionCount = 0;
    const mockClient = {
      models: {
        generateContent: async () => {
          callCount++;
          const err: any = new Error('503 Service Unavailable: High demand temporary overload');
          err.status = 503;
          throw err;
        }
      }
    };

    const adapter = new GeminiAdapter(undefined, 'gemini-3.8-flash', mockClient, { initialDelayMs: 1, jitterMs: 0 });
    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Who is at the door?',
      executeTool: async () => {
        toolExecutionCount++;
        return {};
      }
    });

    expect(result).toBeNull(); // Activates deterministic fallback cleanly
    expect(callCount).toBe(3); // 1 initial attempt + 2 additional retries
    expect(toolExecutionCount).toBe(0); // ZERO tools executed on failure
    expect(adapter.getStatus().status).toBe('REQUEST_FAILED');
    expect(adapter.getStatus().inferenceStatus).toBe('REQUEST_FAILED');
    expect(adapter.getStatus().fallbackActive).toBe(true);

    const meta = adapter.getLastInferenceMetadata();
    expect(meta).not.toBeNull();
    expect(meta?.retryCount).toBe(2);
    expect(meta?.maxRetries).toBe(2);
    expect(meta?.errorCategory).toBe('SERVICE_UNAVAILABLE');
    expect(meta?.fallbackActive).toBe(true);
    expect(meta?.fallbackStatus).toBe('FALLBACK_ACTIVATED');
    expect(meta?.actualProvider).toBe('deterministic');
  });

  it('does NOT retry permanent client errors such as 401 invalid API key or 400 bad request', async () => {
    let callCount = 0;
    const mockClient = {
      models: {
        generateContent: async () => {
          callCount++;
          const err: any = new Error('API_KEY_INVALID: Provided API key is expired or invalid');
          err.status = 401;
          throw err;
        }
      }
    };

    const adapter = new GeminiAdapter(undefined, 'gemini-3.8-flash', mockClient, { initialDelayMs: 1, jitterMs: 0 });
    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Hello',
      executeTool: async () => ({})
    });

    expect(result).toBeNull();
    expect(callCount).toBe(1); // Called ONLY ONCE — permanent error is never retried
    expect(adapter.getStatus().status).toBe('REQUEST_FAILED');

    const meta = adapter.getLastInferenceMetadata();
    expect(meta?.retryCount).toBe(0);
    expect(meta?.errorCategory).toBe('AUTHENTICATION_ERROR');
    expect(meta?.fallbackActive).toBe(true);
  });

  it('respects Retry-After header for bounded delay calculation', async () => {
    let callCount = 0;
    const mockClient = {
      models: {
        generateContent: async () => {
          callCount++;
          if (callCount === 1) {
            const err: any = new Error('429 Rate limit exceeded');
            err.status = 429;
            err.headers = { 'retry-after': '0.01' }; // 10ms
            throw err;
          }
          return { text: 'Recovered after retry-after', functionCalls: undefined };
        }
      }
    };

    const adapter = new GeminiAdapter(undefined, 'gemini-3.8-flash', mockClient, { initialDelayMs: 1, jitterMs: 0 });
    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Hello',
      executeTool: async () => ({})
    });

    expect(result).not.toBeNull();
    expect(callCount).toBe(2);
    expect(result?.retryCount).toBe(1);
    expect(result?.response).toBe('Recovered after retry-after');
  });

  it('distinguishes CONNECTED probe status from inference failure', async () => {
    let inferenceCallCount = 0;
    const mockClient = {
      models: {
        generateContent: async (params: any) => {
          if (params.contents === 'KindDoor connection health probe') {
            // Connection health probe succeeds!
            return { text: 'probe-pong' };
          }
          // Actual assistant inference fails with 503
          inferenceCallCount++;
          const err: any = new Error('503 Service Unavailable: High demand on gemini-3.8-flash');
          err.status = 503;
          throw err;
        }
      }
    };

    const adapter = new GeminiAdapter(undefined, 'gemini-3.8-flash', mockClient, { initialDelayMs: 1, jitterMs: 0 });

    // 1. Connection probe runs and passes
    const probe = await adapter.testConnection();
    expect(probe.success).toBe(true);
    expect(probe.status).toBe('CONNECTED');
    expect(adapter.getStatus().probeStatus).toBe('CONNECTED');

    // 2. Inference runs and fails with 503 (exhausting 2 retries)
    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Who is at the door?',
      executeTool: async () => ({})
    });

    expect(result).toBeNull(); // Clean fallback
    expect(inferenceCallCount).toBe(3);

    // 3. Status inspection proves probe CONNECTED is distinct from inference failure
    const status = adapter.getStatus();
    expect(status.probeStatus).toBe('CONNECTED'); // Probe remains CONNECTED
    expect(status.inferenceStatus).toBe('REQUEST_FAILED'); // Inference is REQUEST_FAILED
    expect(status.fallbackActive).toBe(true);
    expect(status.lastInferenceMetadata?.errorCategory).toBe('SERVICE_UNAVAILABLE');
    expect(status.lastInferenceMetadata?.retryCount).toBe(2);
  });

  it('sanitizes API keys and secrets from diagnostics without leaking credentials', async () => {
    const rawApiKey = 'AIzaSyFakeSecretGeminiKey1234567890';
    const mockClient = {
      models: {
        generateContent: async () => {
          throw new Error(`Request failed at https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${rawApiKey}: 503 UNAVAILABLE with Bearer fake_jwt_token_secret`);
        }
      }
    };

    const adapter = new GeminiAdapter(rawApiKey, 'gemini-3.8-flash', mockClient, { initialDelayMs: 1, jitterMs: 0 });
    const result = await adapter.runInteraction({
      resident: testResident,
      message: 'Hello',
      executeTool: async () => ({})
    });

    expect(result).toBeNull();
    const lastError = adapter.getStatus().lastError || '';
    expect(lastError).not.toContain(rawApiKey);
    expect(lastError).toContain('[REDACTED_API_KEY]');
    expect(lastError).not.toContain('fake_jwt_token_secret');
    expect(lastError).toContain('Bearer [REDACTED_TOKEN]');

    const meta = adapter.getLastInferenceMetadata();
    expect(meta?.sanitizedDiagnostic).not.toContain(rawApiKey);
  });

  it('supports testConnection probe on demand', async () => {
    const mockClient = {
      models: {
        generateContent: async () => ({ text: 'pong' })
      }
    };

    const adapter = new GeminiAdapter(undefined, 'gemini-3.8-flash', mockClient);
    const probe = await adapter.testConnection();
    expect(probe.success).toBe(true);
    expect(probe.status).toBe('CONNECTED');
    expect(adapter.getStatus().status).toBe('CONNECTED');
    expect(adapter.getStatus().probeStatus).toBe('CONNECTED');
  });
});
