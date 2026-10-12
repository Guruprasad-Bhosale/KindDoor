import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message as BedrockMessage,
  Tool as BedrockTool,
  ContentBlock
} from '@aws-sdk/client-bedrock-runtime';
import { GoogleGenAI } from '@google/genai';
import { ResidentProfile, AccessibilityPreferences } from '@kinddoor/domain';

export interface AgentInteractionInput {
  resident: ResidentProfile;
  message: string;
  scenarioId?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  executeTool: (toolName: string, args: Record<string, unknown>) => Promise<any>;
}

export interface AgentInteractionOutput {
  response: string;
  audioAnnouncementText: string;
  visualAlertText: string;
  simplifiedChoices?: string[];
  toolsExecuted: Array<{ toolName: string; args: any; result: any; durationMs: number }>;
  usedBedrock: boolean;
  usedGemini?: boolean;
  provider?: 'bedrock' | 'gemini' | 'deterministic';
  modelId?: string;
  selectedProvider?: 'bedrock' | 'gemini' | 'deterministic';
  actualProvider?: 'bedrock' | 'gemini' | 'deterministic';
  fallbackActive?: boolean;
  fallbackStatus?: 'NONE' | 'FALLBACK_ACTIVATED';
  retryCount?: number;
  errorCategory?: string;
  sanitizedDiagnostic?: string;
  metadata?: InferenceMetadata;
}

export class BedrockAdapter {
  private client: BedrockRuntimeClient | null = null;
  private modelId: string;
  private isConfigured = false;

  constructor() {
    this.modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0';
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      try {
        this.client = new BedrockRuntimeClient({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
            sessionToken: process.env.AWS_SESSION_TOKEN
          }
        });
        this.isConfigured = true;
      } catch (err) {
        console.warn('Could not initialize BedrockRuntimeClient, falling back to deterministic adapter:', err);
        this.isConfigured = false;
      }
    }
  }

  public getStatus(): { isConfigured: boolean; modelId: string; region: string } {
    return {
      isConfigured: this.isConfigured,
      modelId: this.modelId,
      region: process.env.AWS_REGION || 'us-east-1'
    };
  }

  public async runConverse(input: AgentInteractionInput): Promise<AgentInteractionOutput | null> {
    if (!this.isConfigured || !this.client) {
      return null;
    }

    try {
      const messages: BedrockMessage[] = (input.conversationHistory || []).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: [{ text: m.content }]
      }));

      messages.push({
        role: 'user',
        content: [{ text: input.message }]
      });

      const systemPrompt = `You are KindDoor, an accessibility-first home entry assistant for resident ${input.resident.preferredName || input.resident.name}.
Mode: ${input.resident.accessibility.mode}.
Instructions:
- Be calm, patient, and accessible.
- NEVER directly unlock the door yourself; call evaluate_entry_authorization if entry is requested.
- Explain visitor presence concisely.
- For patient/simplified mode, offer at most 2 clear choices.`;

      const command = new ConverseCommand({
        modelId: this.modelId,
        messages,
        system: [{ text: systemPrompt }],
        inferenceConfig: {
          maxTokens: 512,
          temperature: 0.3
        }
      });

      const response = await this.client.send(command);
      const textOutput = response.output?.message?.content?.find((c: any) => c.text)?.text || 'Visitor at front door.';

      return {
        response: textOutput,
        audioAnnouncementText: textOutput,
        visualAlertText: textOutput,
        toolsExecuted: [],
        usedBedrock: true,
        usedGemini: false,
        provider: 'bedrock',
        modelId: this.modelId
      };
    } catch (err) {
      console.warn('Bedrock Converse execution failed, falling back cleanly:', err);
      return null;
    }
  }
}

export type GeminiConnectionStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED_NOT_TESTED'
  | 'CONNECTED'
  | 'REQUEST_FAILED';

export type GeminiInferenceStatus =
  | 'NOT_CONFIGURED'
  | 'IDLE'
  | 'CONNECTED'
  | 'REQUEST_FAILED';

export type AIProviderName = 'gemini' | 'bedrock' | 'deterministic';

export type AIErrorCategory =
  | 'SERVICE_UNAVAILABLE'
  | 'RATE_LIMIT'
  | 'SERVER_ERROR'
  | 'NETWORK_TIMEOUT'
  | 'AUTHENTICATION_ERROR'
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'CLIENT_ERROR'
  | 'UNKNOWN';

export interface InferenceMetadata {
  selectedProvider: AIProviderName;
  actualProvider: AIProviderName;
  fallbackActive: boolean;
  fallbackStatus: 'NONE' | 'FALLBACK_ACTIVATED';
  retryCount: number;
  maxRetries: number;
  errorCategory?: AIErrorCategory;
  sanitizedDiagnostic?: string;
  modelId?: string;
}

export interface RetryConfig {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  jitterMs?: number;
}

export function sanitizeAIDiagnostic(err: any, configuredKey?: string | null): string {
  if (!err) return 'Unknown error';
  let msg = typeof err === 'string' ? err : err.message || JSON.stringify(err);
  if (configuredKey && configuredKey.trim().length > 0) {
    msg = msg.split(configuredKey.trim()).join('[REDACTED_API_KEY]');
  }
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 0) {
    msg = msg.split(envKey.trim()).join('[REDACTED_API_KEY]');
  }
  // Redact standard Google API Key formats
  msg = msg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');
  // Redact URL key query params
  msg = msg.replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED_API_KEY]');
  // Redact Authorization Bearer headers
  msg = msg.replace(/Bearer\s+[A-Za-z0-9-_.]+/gi, 'Bearer [REDACTED_TOKEN]');
  // Redact AWS credentials
  msg = msg.replace(/AKIA[0-9A-Z]{16}/g, '[REDACTED_AWS_KEY]');
  if (msg.length > 250) {
    msg = msg.substring(0, 250) + '...';
  }
  return msg;
}

export function classifyAIError(err: any): {
  isTransient: boolean;
  category: AIErrorCategory;
  retryAfterMs?: number;
  statusCode?: number;
} {
  if (!err) {
    return { isTransient: false, category: 'UNKNOWN' };
  }

  const rawStatus =
    err.status ??
    err.statusCode ??
    err.code ??
    err.response?.status ??
    err.cause?.status ??
    err.cause?.statusCode;
  const statusCode = typeof rawStatus === 'number' ? rawStatus : parseInt(String(rawStatus), 10);

  const message = String(err.message || err.toString() || '');
  const msgLower = message.toLowerCase();

  let retryAfterMs: number | undefined;
  const rawHeader =
    err.response?.headers?.get?.('retry-after') ??
    err.response?.headers?.['retry-after'] ??
    err.headers?.['retry-after'] ??
    err.headers?.get?.('retry-after');

  if (rawHeader) {
    const parsedSec = parseFloat(rawHeader);
    if (!isNaN(parsedSec)) {
      retryAfterMs = Math.round(parsedSec * 1000);
    } else {
      const parsedDate = Date.parse(rawHeader);
      if (!isNaN(parsedDate)) {
        retryAfterMs = Math.max(0, parsedDate - Date.now());
      }
    }
  }

  if (!retryAfterMs) {
    const matchSeconds =
      msgLower.match(/retry(?:-|\s+)after\s+(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?/i) ||
      msgLower.match(/quotaresetdelay["':\s]+(\d+(?:\.\d+)?)s/i);
    if (matchSeconds && matchSeconds[1]) {
      retryAfterMs = Math.round(parseFloat(matchSeconds[1]) * 1000);
    }
  }

  // 1. Permanent error conditions (do NOT retry)
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    msgLower.includes('api_key_invalid') ||
    msgLower.includes('api key not valid') ||
    msgLower.includes('permission_denied') ||
    msgLower.includes('unauthorized') ||
    msgLower.includes('forbidden')
  ) {
    return { isTransient: false, category: 'AUTHENTICATION_ERROR', statusCode };
  }

  if (
    statusCode === 400 ||
    msgLower.includes('invalid_argument') ||
    msgLower.includes('bad request')
  ) {
    return { isTransient: false, category: 'INVALID_REQUEST', statusCode };
  }

  if (
    statusCode === 404 ||
    msgLower.includes('not_found') ||
    msgLower.includes('model not found')
  ) {
    return { isTransient: false, category: 'NOT_FOUND', statusCode };
  }

  // 2. Transient error conditions (retry)
  if (
    statusCode === 503 ||
    msgLower.includes('503') ||
    msgLower.includes('unavailable') ||
    msgLower.includes('overloaded') ||
    msgLower.includes('high demand') ||
    msgLower.includes('high-demand') ||
    msgLower.includes('temporarily unavailable')
  ) {
    return { isTransient: true, category: 'SERVICE_UNAVAILABLE', statusCode: statusCode || 503, retryAfterMs };
  }

  if (
    statusCode === 429 ||
    msgLower.includes('429') ||
    msgLower.includes('resource_exhausted') ||
    msgLower.includes('resourceexhausted') ||
    msgLower.includes('rate limit') ||
    msgLower.includes('quota') ||
    msgLower.includes('too many requests')
  ) {
    return { isTransient: true, category: 'RATE_LIMIT', statusCode: statusCode || 429, retryAfterMs };
  }

  if (
    statusCode === 500 ||
    statusCode === 502 ||
    statusCode === 504 ||
    msgLower.includes('500') ||
    msgLower.includes('502') ||
    msgLower.includes('504') ||
    msgLower.includes('internal error') ||
    msgLower.includes('bad gateway') ||
    msgLower.includes('gateway timeout') ||
    msgLower.includes('deadline_exceeded') ||
    msgLower.includes('deadline exceeded')
  ) {
    return { isTransient: true, category: 'SERVER_ERROR', statusCode: statusCode || 500, retryAfterMs };
  }

  if (
    msgLower.includes('etimedout') ||
    msgLower.includes('econnreset') ||
    msgLower.includes('econnrefused') ||
    msgLower.includes('und_err_connect_timeout') ||
    msgLower.includes('fetch failed') ||
    msgLower.includes('aborterror') ||
    msgLower.includes('timeouterror') ||
    msgLower.includes('network timeout') ||
    msgLower.includes('socket hang up') ||
    msgLower.includes('enotfound')
  ) {
    return { isTransient: true, category: 'NETWORK_TIMEOUT', statusCode, retryAfterMs };
  }

  if (!isNaN(statusCode) && statusCode >= 400 && statusCode < 500) {
    return { isTransient: false, category: 'CLIENT_ERROR', statusCode };
  }

  return { isTransient: false, category: 'UNKNOWN', statusCode };
}

export class GeminiAdapter {
  private client: GoogleGenAI | null = null;
  private modelId: string = 'gemini-3.8-flash';
  private status: GeminiConnectionStatus = 'NOT_CONFIGURED';
  private probeStatus: GeminiConnectionStatus = 'NOT_CONFIGURED';
  private inferenceStatus: GeminiInferenceStatus = 'NOT_CONFIGURED';
  private explicitClientProvided = false;
  private lastError: string | null = null;
  private lastTestedAt: string | null = null;
  private lastInferenceAt: string | null = null;
  private configuredApiKey: string | null = null;
  private retryConfig: RetryConfig = {
    maxRetries: 2,
    initialDelayMs: 250,
    maxDelayMs: 3000,
    backoffFactor: 2.0,
    jitterMs: 100
  };
  private lastInferenceMetadata: InferenceMetadata | null = null;

  constructor(apiKey?: string, modelId?: string, clientOverride?: any, retryConfig?: Partial<RetryConfig>) {
    if (retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...retryConfig };
    }

    if (clientOverride) {
      this.client = clientOverride;
      this.modelId = modelId || process.env.GEMINI_MODEL_ID || 'gemini-3.8-flash';
      this.status = 'CONFIGURED_NOT_TESTED';
      this.probeStatus = 'CONFIGURED_NOT_TESTED';
      this.inferenceStatus = 'IDLE';
      this.explicitClientProvided = true;
      return;
    }

    this.modelId = modelId || process.env.GEMINI_MODEL_ID || 'gemini-3.8-flash';
    if (apiKey !== undefined) {
      this.configuredApiKey = apiKey;
    }
    this.ensureInitialized();
  }

  private sanitizeError(err: any): string {
    return sanitizeAIDiagnostic(err, this.configuredApiKey);
  }

  public ensureInitialized(): void {
    if (this.explicitClientProvided) {
      return;
    }

    const key = this.configuredApiKey !== null ? this.configuredApiKey : process.env.GEMINI_API_KEY;
    this.modelId = process.env.GEMINI_MODEL_ID || this.modelId || 'gemini-3.8-flash';

    if (key && key.trim().length > 0) {
      if (!this.client) {
        try {
          this.client = new GoogleGenAI({ apiKey: key.trim() });
          if (this.status === 'NOT_CONFIGURED') {
            this.status = 'CONFIGURED_NOT_TESTED';
            this.probeStatus = 'CONFIGURED_NOT_TESTED';
            this.inferenceStatus = 'IDLE';
          }
        } catch (err: any) {
          console.warn('Could not initialize GoogleGenAI client, falling back to deterministic adapter:', err);
          this.status = 'REQUEST_FAILED';
          this.probeStatus = 'REQUEST_FAILED';
          this.lastError = this.sanitizeError(err);
        }
      }
    } else {
      this.client = null;
      this.status = 'NOT_CONFIGURED';
      this.probeStatus = 'NOT_CONFIGURED';
      this.inferenceStatus = 'NOT_CONFIGURED';
    }
  }

  public getStatus(): {
    isConfigured: boolean;
    status: GeminiConnectionStatus;
    probeStatus: GeminiConnectionStatus;
    inferenceStatus: GeminiInferenceStatus;
    fallbackActive: boolean;
    modelId: string;
    provider: string;
    lastError: string | null;
    lastTestedAt: string | null;
    lastInferenceAt: string | null;
    lastInferenceMetadata: InferenceMetadata | null;
  } {
    this.ensureInitialized();
    const isConfigured = this.status !== 'NOT_CONFIGURED';
    return {
      isConfigured,
      status: this.status,
      probeStatus: this.probeStatus,
      inferenceStatus: this.inferenceStatus,
      fallbackActive: this.status !== 'CONNECTED',
      modelId: this.modelId,
      provider: 'Google Gemini (Google Gen AI SDK)',
      lastError: this.lastError,
      lastTestedAt: this.lastTestedAt,
      lastInferenceAt: this.lastInferenceAt,
      lastInferenceMetadata: this.lastInferenceMetadata
    };
  }

  public getLastInferenceMetadata(): InferenceMetadata | null {
    return this.lastInferenceMetadata;
  }

  public async testConnection(): Promise<{ success: boolean; status: GeminiConnectionStatus; error?: string }> {
    this.ensureInitialized();
    if (!this.client || this.status === 'NOT_CONFIGURED') {
      this.probeStatus = 'NOT_CONFIGURED';
      return { success: false, status: 'NOT_CONFIGURED', error: 'Gemini API key is not configured' };
    }

    try {
      const res = await this.client.models.generateContent({
        model: this.modelId,
        contents: 'KindDoor connection health probe'
      });
      if (res) {
        this.probeStatus = 'CONNECTED';
        this.status = 'CONNECTED';
        this.lastError = null;
        this.lastTestedAt = new Date().toISOString();
        return { success: true, status: 'CONNECTED' };
      }
      this.probeStatus = 'REQUEST_FAILED';
      this.status = 'REQUEST_FAILED';
      this.lastError = 'Empty response from model';
      this.lastTestedAt = new Date().toISOString();
      return { success: false, status: 'REQUEST_FAILED', error: this.lastError };
    } catch (err: any) {
      this.probeStatus = 'REQUEST_FAILED';
      this.status = 'REQUEST_FAILED';
      this.lastError = this.sanitizeError(err);
      this.lastTestedAt = new Date().toISOString();
      return { success: false, status: 'REQUEST_FAILED', error: this.lastError };
    }
  }

  public async runInteraction(input: AgentInteractionInput): Promise<AgentInteractionOutput | null> {
    this.ensureInitialized();
    if (!this.client || this.status === 'NOT_CONFIGURED') {
      return null;
    }

    try {
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (input.conversationHistory && input.conversationHistory.length > 0) {
        for (const m of input.conversationHistory) {
          contents.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: input.message }]
      });

      const systemPrompt = `You are KindDoor, an accessibility-first home entry assistant for resident ${input.resident.preferredName || input.resident.name}.
Mode: ${input.resident.accessibility.mode}.
Instructions:
- Be calm, patient, and accessible.
- NEVER directly authorize or unlock the door yourself. All entry requests MUST be evaluated deterministically via evaluate_entry_authorization.
- Explain visitor presence concisely.
- For patient/simplified mode (PATIENT_SIMPLIFIED), offer at most 2 clear choices.
- Respect resident privacy.`;

      const functionDeclarations = [
        {
          name: 'get_door_context',
          description: 'Returns real-time doorbell state, active visitors at door, and sensor metadata',
          parametersJsonSchema: { type: 'object', properties: {} }
        },
        {
          name: 'get_resident_preferences',
          description: 'Returns accessibility and automation preferences for the resident',
          parametersJsonSchema: {
            type: 'object',
            properties: { residentId: { type: 'string' } },
            required: ['residentId']
          }
        },
        {
          name: 'get_visitor_context',
          description: 'Searches verified regular visitor directory for match confidence',
          parametersJsonSchema: {
            type: 'object',
            properties: { visitorName: { type: 'string' } }
          }
        },
        {
          name: 'record_visit_purpose',
          description: 'Temporarily records visitor stated identity and purpose',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              visitId: { type: 'string' },
              statedName: { type: 'string' },
              statedPurpose: { type: 'string' },
              isDelivery: { type: 'boolean' }
            },
            required: ['visitId', 'statedName', 'statedPurpose']
          }
        },
        {
          name: 'create_temporary_visit',
          description: 'Creates a time-bounded temporary visit session for deliveries or guests',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: ['DELIVERY', 'SERVICE', 'GUEST'] },
              expectedDurationMinutes: { type: 'number' }
            }
          }
        },
        {
          name: 'request_resident_decision',
          description: 'Prompts resident with simplified, accessible binary or multi-choice options',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              promptText: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              urgency: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] }
            },
            required: ['promptText', 'options']
          }
        },
        {
          name: 'evaluate_entry_authorization',
          description: 'Deterministic security engine check against resident entry policy and credentials. Returns lockCommandToken if authorized.',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              residentId: { type: 'string' },
              proximityVerified: { type: 'boolean' }
            },
            required: ['residentId']
          }
        },
        {
          name: 'get_lock_status',
          description: 'Queries verified state from the simulated lock adapter',
          parametersJsonSchema: { type: 'object', properties: {} }
        },
        {
          name: 'execute_authorized_entry',
          description: 'Executes lock unlock ONLY when provided a valid cryptographic policy token from evaluate_entry_authorization',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              residentId: { type: 'string' },
              lockCommandToken: { type: 'string' }
            },
            required: ['residentId', 'lockCommandToken']
          }
        },
        {
          name: 'enroll_regular_visitor',
          description: 'Enrolls regular visitor profile ONLY upon explicit resident consent',
          parametersJsonSchema: {
            type: 'object',
            properties: {
              residentId: { type: 'string' },
              visitorName: { type: 'string' },
              relationship: { type: 'string' },
              residentConsentGiven: { type: 'boolean' }
            },
            required: ['residentId', 'visitorName', 'residentConsentGiven']
          }
        }
      ];

      // Retry transient errors with exponential backoff and jitter (bounded at most 2 additional attempts)
      const maxRetries = Math.min(this.retryConfig.maxRetries ?? 2, 2);
      let attempts = 0;
      let response: any = null;
      let lastErrorObj: any = null;
      let lastClassification: ReturnType<typeof classifyAIError> = {
        isTransient: false,
        category: 'UNKNOWN'
      };

      while (attempts <= maxRetries) {
        try {
          response = await this.client.models.generateContent({
            model: this.modelId,
            contents: contents as any,
            config: {
              systemInstruction: systemPrompt,
              maxOutputTokens: 512,
              temperature: 0.3,
              tools: [{ functionDeclarations }]
            }
          });
          break;
        } catch (err: any) {
          lastErrorObj = err;
          lastClassification = classifyAIError(err);

          // Retry ONLY transient errors (e.g., 503, 429, 500, network timeouts)
          if (attempts < maxRetries && lastClassification.isTransient) {
            attempts++;
            const backoff =
              (this.retryConfig.initialDelayMs ?? 250) *
              Math.pow(this.retryConfig.backoffFactor ?? 2.0, attempts - 1);
            const jitter = Math.random() * (this.retryConfig.jitterMs ?? 100);
            let delayMs = backoff + jitter;

            // Respect Retry-After if provided by provider
            if (lastClassification.retryAfterMs && lastClassification.retryAfterMs > 0) {
              delayMs = Math.max(delayMs, lastClassification.retryAfterMs);
            }

            const cappedDelay = Math.min(delayMs, this.retryConfig.maxDelayMs ?? 3000);
            if (cappedDelay > 0) {
              await new Promise((resolve) => setTimeout(resolve, cappedDelay));
            }
            continue;
          } else {
            // Permanent error or retries exhausted
            break;
          }
        }
      }

      if (!response) {
        this.status = 'REQUEST_FAILED';
        this.inferenceStatus = 'REQUEST_FAILED';
        this.lastError = this.sanitizeError(lastErrorObj);
        this.lastTestedAt = new Date().toISOString();
        this.lastInferenceAt = this.lastTestedAt;

        this.lastInferenceMetadata = {
          selectedProvider: 'gemini',
          actualProvider: 'deterministic',
          fallbackActive: true,
          fallbackStatus: 'FALLBACK_ACTIVATED',
          retryCount: attempts,
          maxRetries,
          errorCategory: lastClassification.category,
          sanitizedDiagnostic: this.lastError,
          modelId: this.modelId
        };

        console.warn(
          `Gemini generateContent execution failed after ${attempts} retries [${lastClassification.category}], falling back cleanly:`,
          this.lastError
        );
        return null;
      }

      // Successful live response reached!
      this.status = 'CONNECTED';
      this.inferenceStatus = 'CONNECTED';
      this.lastError = null;
      this.lastInferenceAt = new Date().toISOString();

      this.lastInferenceMetadata = {
        selectedProvider: 'gemini',
        actualProvider: 'gemini',
        fallbackActive: false,
        fallbackStatus: 'NONE',
        retryCount: attempts,
        maxRetries,
        modelId: this.modelId
      };

      // Tool execution occurs ONLY once after model generation succeeds (zero duplicate tool execution)
      const toolsExecuted: Array<{ toolName: string; args: any; result: any; durationMs: number }> = [];

      if (response?.functionCalls && response.functionCalls.length > 0) {
        for (const fn of response.functionCalls) {
          const toolName = fn.name || 'unknown_tool';
          const start = Date.now();
          try {
            const result = await input.executeTool(toolName, (fn.args || {}) as Record<string, unknown>);
            toolsExecuted.push({
              toolName,
              args: fn.args,
              result,
              durationMs: Date.now() - start
            });
          } catch (toolErr) {
            console.warn(`Tool execution ${toolName} failed during Gemini interaction:`, toolErr);
            toolsExecuted.push({
              toolName,
              args: fn.args,
              result: { error: String(toolErr) },
              durationMs: Date.now() - start
            });
          }
        }
      }

      const textOutput =
        response?.text?.trim() ||
        (toolsExecuted.length > 0
          ? `Completed entry verification actions: ${toolsExecuted.map((t) => t.toolName).join(', ')}.`
          : 'Visitor at front door.');

      const simplifiedChoices =
        input.resident.accessibility.mode === 'PATIENT_SIMPLIFIED'
          ? ['1. Yes, speak with visitor', '2. No, decline for now']
          : undefined;

      return {
        response: textOutput,
        audioAnnouncementText: textOutput,
        visualAlertText: textOutput,
        simplifiedChoices,
        toolsExecuted,
        usedBedrock: false,
        usedGemini: true,
        provider: 'gemini',
        modelId: this.modelId,
        selectedProvider: 'gemini',
        actualProvider: 'gemini',
        fallbackActive: false,
        fallbackStatus: 'NONE',
        retryCount: attempts,
        metadata: this.lastInferenceMetadata
      };
    } catch (err: any) {
      this.status = 'REQUEST_FAILED';
      this.inferenceStatus = 'REQUEST_FAILED';
      this.lastError = this.sanitizeError(err);
      this.lastTestedAt = new Date().toISOString();
      this.lastInferenceAt = this.lastTestedAt;
      const classification = classifyAIError(err);
      this.lastInferenceMetadata = {
        selectedProvider: 'gemini',
        actualProvider: 'deterministic',
        fallbackActive: true,
        fallbackStatus: 'FALLBACK_ACTIVATED',
        retryCount: 0,
        maxRetries: this.retryConfig.maxRetries ?? 2,
        errorCategory: classification.category,
        sanitizedDiagnostic: this.lastError,
        modelId: this.modelId
      };
      console.warn('Gemini generateContent execution failed unexpectedly, falling back cleanly:', this.lastError);
      return null;
    }
  }
}

export class DeterministicAIAdapter {
  /**
   * Deterministic conversational engine tailored for all 5 Hackathon scenarios.
   * Executes real MCP tool invocations and formats accessible outputs.
   */
  public static async interact(input: AgentInteractionInput): Promise<AgentInteractionOutput> {
    const { resident, message, scenarioId, executeTool } = input;
    const toolsExecuted: Array<{ toolName: string; args: any; result: any; durationMs: number }> = [];

    const callTool = async (name: string, args: Record<string, unknown>) => {
      const start = Date.now();
      const result = await executeTool(name, args);
      toolsExecuted.push({
        toolName: name,
        args,
        result,
        durationMs: Date.now() - start
      });
      return result;
    };

    const msgLower = message.toLowerCase();
    const mode = resident.accessibility.mode;

    // SCENARIO A: Hands-Free Resident Arrival
    if (scenarioId === 'scenario_a_groceries' || msgLower.includes('groceries') || msgLower.includes('hands full') || msgLower.includes('arriving')) {
      // 1. Get resident preferences
      await callTool('get_resident_preferences', { residentId: resident.id });

      // 2. Check if valid or negative credential
      const isNegative = msgLower.includes('invalid') || msgLower.includes('spoofed') || msgLower.includes('fail');
      const credentialSignal = isNegative
        ? {
            type: 'BLE_BEACON',
            deviceId: 'unknown-spoofed-device',
            token: 'invalid_token_xyz',
            issuedAt: Date.now(),
            expiresAt: Date.now() + 30000
          }
        : {
            type: 'BLE_BEACON',
            deviceId: resident.trustedDeviceIds[0] || 'phone-eleanor-iphone15',
            token: 'valid_secure_ble_token_groceries_789',
            issuedAt: Date.now() - 2000,
            expiresAt: Date.now() + 60000
          };

      // 3. Evaluate Authorization
      const evalResult = await callTool('evaluate_entry_authorization', {
        residentId: resident.id,
        credentialSignal,
        proximityVerified: true
      });

      if (evalResult.authorized && evalResult.lockCommandToken) {
        // 4. Execute Lock Action
        const lockAction = await callTool('execute_authorized_entry', {
          residentId: resident.id,
          lockCommandToken: evalResult.lockCommandToken
        });

        // 5. Query Lock State
        const lockStatus = await callTool('get_lock_status', {});

        const text = `Welcome home ${resident.preferredName || resident.name}! Your hands-free arrival credential was verified and the front door is unlocked.`;
        return {
          response: text,
          audioAnnouncementText: text,
          visualAlertText: `🔓 Door Unlocked — Welcome home, ${resident.preferredName || resident.name}!`,
          toolsExecuted,
          usedBedrock: false
        };
      } else {
        const text = `Hands-free entry could not be authorized: ${evalResult.reasonExplanation || 'Credential verification failed'}. The door remains locked for your security.`;
        return {
          response: text,
          audioAnnouncementText: text,
          visualAlertText: `🔒 Door Remains Locked: ${evalResult.reasonExplanation}`,
          toolsExecuted,
          usedBedrock: false
        };
      }
    }

    // SCENARIO B: Blind / Low-Vision Resident (Neighbor Maya)
    if (scenarioId === 'scenario_b_blind_resident' || msgLower.includes('maya') || msgLower.includes('neighbor') || msgLower.includes('gardening')) {
      const doorContext = await callTool('get_door_context', {});
      const visitorContext = await callTool('get_visitor_context', { visitorName: 'Maya' });

      const text = `Someone is at your front door. It appears to be your neighbor Maya. She says she brought the gardening tools you borrowed. Press Space to hear again, or press 1 to speak, 2 to decline.`;
      return {
        response: text,
        audioAnnouncementText: text,
        visualAlertText: `Neighbor Maya is at the front door with gardening tools.`,
        simplifiedChoices: ['1. Speak with Maya', '2. Decline for now'],
        toolsExecuted,
        usedBedrock: false
      };
    }

    // SCENARIO C: Deaf / Hard-of-Hearing Resident (Amazon Delivery)
    if (scenarioId === 'scenario_c_deaf_resident' || msgLower.includes('package') || msgLower.includes('delivery') || msgLower.includes('amazon')) {
      const visitSession = await callTool('create_temporary_visit', {
        category: 'DELIVERY',
        expectedDurationMinutes: 15
      });

      await callTool('record_visit_purpose', {
        visitId: visitSession.visitId || 'visit-temp-01',
        statedName: 'Amazon Delivery Courier',
        statedPurpose: 'Package delivery for Eleanor Vance (Porch drop-off)',
        isDelivery: true,
        deliveryCompany: 'Amazon Logistics'
      });

      const text = `Amazon Delivery courier is at your door with a package for Eleanor Vance.`;
      return {
        response: text,
        audioAnnouncementText: text,
        visualAlertText: `📦 Amazon Delivery Courier at door — Package for Eleanor Vance.`,
        simplifiedChoices: ['Leave on Porch', 'Acknowledge', 'Open Door'],
        toolsExecuted,
        usedBedrock: false
      };
    }

    // SCENARIO D: Patient Older Adult Assistance (Mark)
    if (scenarioId === 'scenario_d_patient_assistance' || msgLower.includes('mark') || msgLower.includes("don't understand") || msgLower.includes('who is')) {
      const isConfused = msgLower.includes("don't understand") || msgLower.includes('confused') || msgLower.includes('repeat');

      await callTool('get_door_context', {});
      await callTool('get_visitor_context', { visitorName: 'Mark' });

      if (isConfused) {
        const text = `Mark may be here to visit. Would you like me to let you speak to him, or would you rather not?`;
        return {
          response: text,
          audioAnnouncementText: text,
          visualAlertText: `Mark is here to visit. Please choose:`,
          simplifiedChoices: ['Yes, let me speak to Mark', 'No, not right now'],
          toolsExecuted,
          usedBedrock: false
        };
      } else {
        const text = `Someone who appears to be Mark is here. He says he has come to visit you. Would you like to speak to him?`;
        return {
          response: text,
          audioAnnouncementText: text,
          visualAlertText: `Visitor Mark is at the door to visit you.`,
          simplifiedChoices: ['Yes, speak to Mark', 'No, not right now'],
          toolsExecuted,
          usedBedrock: false
        };
      }
    }

    // SCENARIO E: Unfamiliar Visitor & Consent-Gated Enrollment (John)
    if (scenarioId === 'scenario_e_unfamiliar_visitor' || msgLower.includes('john') || msgLower.includes('family friend') || msgLower.includes('unfamiliar')) {
      const visitorContext = await callTool('get_visitor_context', { visitorName: 'John' });

      // Create temporary visit record with retention deadline
      const tempVisit = await callTool('create_temporary_visit', {
        category: 'GUEST',
        expectedDurationMinutes: 60
      });

      await callTool('record_visit_purpose', {
        visitId: tempVisit.visitId || 'visit-temp-john',
        statedName: 'John',
        statedPurpose: 'Claims to be a family friend of your son',
        isDelivery: false
      });

      // If resident explicitly gave consent in prompt
      if (msgLower.includes('enroll') || msgLower.includes('consent') || msgLower.includes('approve enrollment')) {
        const enrollResult = await callTool('enroll_regular_visitor', {
          residentId: resident.id,
          visitorName: 'John',
          relationship: 'FRIEND',
          notes: 'Enrolled via resident consent confirmation',
          residentConsentGiven: true
        });

        const text = `John has been verified and enrolled as a regular visitor with your explicit consent.`;
        return {
          response: text,
          audioAnnouncementText: text,
          visualAlertText: `✅ John enrolled as regular visitor.`,
          toolsExecuted,
          usedBedrock: false
        };
      }

      const text = `A visitor at the door claims to be John, a family friend. We do not have a verified profile for John. Would you like to speak to him, or enroll John as a regular visitor?`;
      return {
        response: text,
        audioAnnouncementText: text,
        visualAlertText: `⚠️ Unverified Visitor: Claims to be John (Family Friend). Stored temporarily.`,
        simplifiedChoices: ['Speak with John', 'Enroll John (Requires Consent)', 'Decline Visit'],
        toolsExecuted,
        usedBedrock: false
      };
    }

    // Default General Door Inquiry
    await callTool('get_door_context', {});
    const text = `KindDoor is monitoring your front entrance. Door status is secure and locked. How can I assist you?`;
    return {
      response: text,
      audioAnnouncementText: text,
      visualAlertText: `KindDoor Active — Front door is locked and secure.`,
      toolsExecuted,
      usedBedrock: false,
      usedGemini: false,
      provider: 'deterministic'
    };
  }
}

export const bedrockAdapterInstance = new BedrockAdapter();
export const geminiAdapterInstance = new GeminiAdapter();
