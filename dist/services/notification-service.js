import { config } from '../config/index.js';
export class NotificationService {
    async notifyHOD(alert) {
        if (!config.NOTIFY_ON_ESCALATION)
            return;
        // Structured alert logging (In production, this hooks to SendGrid/SES email, Slack webhook, or SMS)
        console.log(`\n🚨 [HOD/ADMIN ALERT] Urgency: ${alert.urgency}`);
        console.log(`Reference ID: ${alert.referenceId}`);
        console.log(`Category: ${alert.category}`);
        console.log(`Summary: ${alert.summary}`);
        if (alert.reason)
            console.log(`Trigger: ${alert.reason}`);
        console.log(`Recipient Email: ${config.HOD_NOTIFICATION_EMAIL}`);
        console.log(`----------------------------------------------------\n`);
    }
    async notifyNewRequirement(req) {
        if (!config.NOTIFY_ON_NEW_REQUIREMENT)
            return;
        console.log(`\n📝 [NEW REQUIREMENT FILED] Ref: ${req.referenceId} | Category: ${req.category}`);
    }
}
export const notificationService = new NotificationService();
