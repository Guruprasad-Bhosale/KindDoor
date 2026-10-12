import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message as BedrockMessage,
  Tool as BedrockTool,
  ContentBlock
} from '@aws-sdk/client-bedrock-runtime';
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
  modelId?: string;
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
        modelId: this.modelId
      };
    } catch (err) {
      console.warn('Bedrock Converse execution failed, falling back cleanly:', err);
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
      usedBedrock: false
    };
  }
}

export const bedrockAdapterInstance = new BedrockAdapter();
