import { config } from '../config/index.js';
import { RequirementRecord, UrgencyLevel } from '../types/index.js';
import { whatsappClient } from '../adapters/whatsapp/client.js';

export interface AlertPayload {
  referenceId: string;
  category: string;
  urgency: UrgencyLevel;
  summary: string;
  senderPhoneHash: string;
  reason?: string;
}

export class NotificationService {
  async notifyHOD(alert: AlertPayload): Promise<void> {
    if (!config.NOTIFY_ON_ESCALATION) return;

    // 1. Structured alert console logging
    console.log(`\n🚨 [HOD/ADMIN ALERT] Urgency: ${alert.urgency}`);
    console.log(`Reference ID: ${alert.referenceId}`);
    console.log(`Category: ${alert.category}`);
    console.log(`Summary: ${alert.summary}`);
    if (alert.reason) console.log(`Trigger: ${alert.reason}`);
    console.log(`Recipient Email: ${config.HOD_NOTIFICATION_EMAIL}`);
    console.log(`----------------------------------------------------\n`);

    // 2. Direct WhatsApp Alert to HOD (Zero-Dashboard Mobile-First Workflow)
    if (config.HOD_WHATSAPP_NUMBER) {
      try {
        const hodText =
          `🚨 *URGENT HOD ESCALATION ALERT*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 *Reference ID:* ${alert.referenceId}\n` +
          `⚡ *Urgency:* ${alert.urgency}\n` +
          `🏷️ *Category:* ${alert.category.replace(/_/g, ' ')}\n` +
          `📝 *Student Message:* "${alert.summary}"\n` +
          (alert.reason ? `⚠️ *Escalation Trigger:* ${alert.reason}\n` : '') +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `*Direct WhatsApp Action Commands:*\n` +
          `• Reply \`APPROVE ${alert.referenceId} [note]\` to approve\n` +
          `• Reply \`REJECT ${alert.referenceId} [reason]\` to decline\n` +
          `• Reply \`STATUS ${alert.referenceId}\` for full details`;

        await whatsappClient.send({
          to: config.HOD_WHATSAPP_NUMBER,
          text: hodText,
        });
        console.log(`[NotificationService] Dispatched WhatsApp escalation alert to HOD (${config.HOD_WHATSAPP_NUMBER})`);
      } catch (err: any) {
        console.error(`[NotificationService] Failed to send WhatsApp alert to HOD:`, err.message);
      }
    }
  }

  async notifyNewRequirement(req: RequirementRecord): Promise<void> {
    if (!config.NOTIFY_ON_NEW_REQUIREMENT) return;

    console.log(`\n📝 [NEW REQUIREMENT FILED] Ref: ${req.referenceId} | Category: ${req.category}`);

    // If configured, notify HOD on WhatsApp
    if (config.HOD_WHATSAPP_NUMBER && req.urgency === 'HIGH') {
      try {
        const alertText =
          `📋 *New Urgent Requirement Logged*\n` +
          `• *Ref:* ${req.referenceId}\n` +
          `• *Category:* ${req.category.replace(/_/g, ' ')}\n` +
          `• *Urgency:* ${req.urgency}\n` +
          `_Student has been directed to submit the official department form._`;

        await whatsappClient.send({
          to: config.HOD_WHATSAPP_NUMBER,
          text: alertText,
        });
      } catch (err: any) {
        console.error(`[NotificationService] Failed to send WhatsApp requirement notice to HOD:`, err.message);
      }
    }
  }

  async notifyFormSynced(refId: string, details: { studentName?: string; phone?: string; query?: string }): Promise<void> {
    if (!config.HOD_WHATSAPP_NUMBER) return;

    try {
      const msg =
        `✅ *Google Form Received & Verified*\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📌 *Reference:* ${refId}\n` +
        (details.studentName ? `👤 *Student:* ${details.studentName}\n` : '') +
        (details.phone ? `📱 *Phone:* ${details.phone}\n` : '') +
        (details.query ? `📝 *Form Entry:* "${details.query}"\n` : '') +
        `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Reply \`APPROVE ${refId}\` or \`REJECT ${refId}\` directly here.`;

      await whatsappClient.send({
        to: config.HOD_WHATSAPP_NUMBER,
        text: msg,
      });
    } catch (err: any) {
      console.error(`[NotificationService] Failed to notify HOD of form sync:`, err.message);
    }
  }
}

export const notificationService = new NotificationService();
