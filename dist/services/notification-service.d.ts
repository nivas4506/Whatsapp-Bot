import { RequirementRecord, UrgencyLevel } from '../types/index.js';
export interface AlertPayload {
    referenceId: string;
    category: string;
    urgency: UrgencyLevel;
    summary: string;
    senderPhoneHash: string;
    reason?: string;
}
export declare class NotificationService {
    notifyHOD(alert: AlertPayload): Promise<void>;
    notifyNewRequirement(req: RequirementRecord): Promise<void>;
}
export declare const notificationService: NotificationService;
