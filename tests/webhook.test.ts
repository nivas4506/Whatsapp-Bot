import { describe, it, expect } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import { app } from '../src/app.js';
import { config } from '../src/config/index.js';

describe('WhatsApp Webhook API', () => {
  it('GET /webhooks/whatsapp should respond with challenge on valid token', async () => {
    const res = await request(app)
      .get('/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': config.WHATSAPP_VERIFY_TOKEN,
        'hub.challenge': '11559955',
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('11559955');
  });

  it('GET /webhooks/whatsapp should reject invalid verify token', async () => {
    const res = await request(app)
      .get('/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': '11559955',
      });

    expect(res.status).toBe(403);
  });

  it('POST /webhooks/whatsapp should accept valid payload with HMAC signature and return 200 immediately', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '1234567890',
                  phone_number_id: config.WHATSAPP_PHONE_NUMBER_ID,
                },
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.test.001',
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: 'text',
                    text: { body: 'What are HOD office hours?' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const rawPayload = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', config.WHATSAPP_APP_SECRET)
      .update(rawPayload)
      .digest('hex');

    const res = await request(app)
      .post('/webhooks/whatsapp')
      .set('X-Hub-Signature-256', `sha256=${signature}`)
      .set('Content-Type', 'application/json')
      .send(rawPayload);

    expect(res.status).toBe(200);
    expect(res.text).toBe('EVENT_RECEIVED');
  });
});
