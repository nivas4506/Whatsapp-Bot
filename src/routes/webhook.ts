import { Router, Request, Response } from 'express';
import { config } from '../config/index.js';
import { verifyWebhookSignature } from '../adapters/whatsapp/signature.js';
import { normalizeMetaWebhook } from '../adapters/whatsapp/normalizer.js';
import { orchestrator } from '../core/orchestrator.js';
import { MetaWebhookPayload } from '../adapters/whatsapp/types.js';

export const webhookRouter = Router();

/**
 * GET /webhooks/whatsapp
 * Meta WhatsApp Webhook Handshake / Verification Endpoint
 */
webhookRouter.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.WHATSAPP_VERIFY_TOKEN) {
    console.log('[Webhook] Verification challenge succeeded.');
    res.status(200).send(challenge);
  } else {
    console.warn('[Webhook] Verification failed: invalid token or mode.', { mode, token });
    res.status(403).json({ error: 'Verification failed' });
  }
});

/**
 * POST /webhooks/whatsapp
 * Inbound Webhook Event Processor
 */
webhookRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const signatureHeader = req.header('X-Hub-Signature-256');
  const rawBody = (req as any).rawBody || JSON.stringify(req.body);

  // In production or when App Secret is set, verify signature
  if (config.NODE_ENV === 'production' || signatureHeader) {
    const isValid = verifyWebhookSignature(rawBody, signatureHeader);
    if (!isValid) {
      console.error('[Webhook] Invalid X-Hub-Signature-256 signature.');
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }
  }

  // Fast acknowledgment: Return 200 OK immediately as required by Meta WhatsApp Cloud API SLA (<3s)
  res.status(200).send('EVENT_RECEIVED');

  try {
    const payload = req.body as MetaWebhookPayload;
    const inboundMessages = normalizeMetaWebhook(payload);

    for (const msg of inboundMessages) {
      // Asynchronous orchestrator execution
      orchestrator.processInboundMessage(msg).catch((err) => {
        console.error(`[Webhook] Error processing message ${msg.providerMessageId}:`, err);
      });
    }
  } catch (err: any) {
    console.error('[Webhook] Error parsing webhook body:', err.message);
  }
});
