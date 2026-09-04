import crypto from 'crypto';
import { config } from '../../config/index.js';

export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader?: string,
  appSecret: string = config.WHATSAPP_APP_SECRET
): boolean {
  if (!signatureHeader) {
    return false;
  }

  // Header format: 'sha256=abcdef...'
  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const expectedHash = parts[1];
  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf-8') : rawBody);
  const calculatedHash = hmac.digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash, 'hex'),
      Buffer.from(calculatedHash, 'hex')
    );
  } catch {
    return false;
  }
}
