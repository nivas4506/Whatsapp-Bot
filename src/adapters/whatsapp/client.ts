import { config } from '../../config/index.js';
import {
  MetaOutboundTextMessage,
  MetaOutboundInteractiveButtonMessage,
  MetaOutboundInteractiveCtaUrlMessage,
} from './types.js';

export interface SendMessageOptions {
  to: string;
  text: string;
  interactiveButtons?: Array<{ id: string; title: string }>;
  ctaUrl?: { title: string; url: string };
}

export class WhatsAppClient {
  private apiUrl: string;
  private apiToken: string;
  private mockMode: boolean;
  public sentMessages: Array<{ to: string; payload: any }> = []; // Useful for test assertions

  constructor() {
    this.apiUrl = `https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    this.apiToken = config.WHATSAPP_API_TOKEN;
    this.mockMode = config.WHATSAPP_MOCK_MODE || config.NODE_ENV === 'test';
  }

  async send(options: SendMessageOptions): Promise<{ success: boolean; messageId: string }> {
    const { to, text, interactiveButtons, ctaUrl } = options;

    let payload:
      | MetaOutboundTextMessage
      | MetaOutboundInteractiveButtonMessage
      | MetaOutboundInteractiveCtaUrlMessage;

    if (ctaUrl) {
      // Interactive CTA URL button (Google Form handoff)
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: {
            text,
          },
          footer: {
            text: config.DEPARTMENT_NAME,
          },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: ctaUrl.title.slice(0, 20), // Meta limit 20 chars
              url: ctaUrl.url,
            },
          },
        },
      };
    } else if (interactiveButtons && interactiveButtons.length > 0 && interactiveButtons.length <= 3) {
      // Interactive Reply Buttons (Meta allows up to 3 quick buttons)
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text,
          },
          footer: {
            text: config.HOD_DISPLAY_NAME,
          },
          action: {
            buttons: interactiveButtons.map((b) => ({
              type: 'reply',
              reply: {
                id: b.id,
                title: b.title.slice(0, 20),
              },
            })),
          },
        },
      };
    } else {
      // Standard Text message
      payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          body: text,
          preview_url: true,
        },
      };
    }

    if (this.mockMode) {
      const mockId = `mock_msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      this.sentMessages.push({ to, payload });
      if (config.NODE_ENV !== 'test') {
        console.log(`\n💬 [WhatsApp Mock Outbound to ${to}]:\n${text}\n`);
        if (ctaUrl) console.log(`👉 Button: [${ctaUrl.title}] -> ${ctaUrl.url}\n`);
      }
      return { success: true, messageId: mockId };
    }

    // Call real Meta Graph API
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('[WhatsApp Client Error]', response.status, errText);
        throw new Error(`WhatsApp API failed with status ${response.status}: ${errText}`);
      }

      const data = (await response.json()) as any;
      const messageId = data?.messages?.[0]?.id || `wamid_${Date.now()}`;
      return { success: true, messageId };
    } catch (err: any) {
      console.error('[WhatsApp Client Exception]', err.message);
      throw err;
    }
  }
}

export const whatsappClient = new WhatsAppClient();
