import { StudentContact, Conversation, StoredMessage, RequirementRecord, FAQEntry, FormConfig, AuditEvent, ConversationState, RequirementCategory, RequirementStatus, UrgencyLevel } from '../../types/index.js';
import { IContactRepository, IConversationRepository, IMessageRepository, IRequirementRepository, IFAQRepository, IFormConfigRepository, IAuditRepository } from './interfaces.js';
export declare class PgContactRepository implements IContactRepository {
    findByPhone(phone: string): Promise<StudentContact | null>;
    upsert(phone: string, consentState?: boolean): Promise<StudentContact>;
    updateLastSeen(id: string): Promise<void>;
}
export declare class PgConversationRepository implements IConversationRepository {
    getActiveByContactId(contactId: string): Promise<Conversation | null>;
    create(contactId: string, state?: ConversationState, locale?: string): Promise<Conversation>;
    updateState(id: string, state: ConversationState): Promise<void>;
    close(id: string): Promise<void>;
    assignReviewer(id: string, reviewer: string): Promise<void>;
}
export declare class PgMessageRepository implements IMessageRepository {
    isMessageProcessed(providerMessageId: string): Promise<boolean>;
    recordMessage(providerMessageId: string, conversationId: string, direction: 'INBOUND' | 'OUTBOUND', type: string, content: string): Promise<StoredMessage>;
}
export declare class PgRequirementRepository implements IRequirementRepository {
    private generateReferenceId;
    create(conversationId: string, category: RequirementCategory, summary: string, formUrl?: string, urgency?: UrgencyLevel): Promise<RequirementRecord>;
    findById(id: string): Promise<RequirementRecord | null>;
    findByReferenceId(referenceId: string): Promise<RequirementRecord | null>;
    updateStatus(id: string, status: RequirementStatus, reviewer?: string): Promise<RequirementRecord | null>;
    linkFormResponse(referenceId: string, formResponseId: string): Promise<RequirementRecord | null>;
    list(filters?: {
        status?: RequirementStatus;
        category?: RequirementCategory;
        limit?: number;
        offset?: number;
    }): Promise<RequirementRecord[]>;
}
export declare class PgFAQRepository implements IFAQRepository {
    findMatching(query: string, locale?: string): Promise<FAQEntry | null>;
    listActive(locale?: string): Promise<FAQEntry[]>;
}
export declare class PgFormConfigRepository implements IFormConfigRepository {
    getByCategory(category: RequirementCategory): Promise<FormConfig | null>;
    getDefault(): Promise<FormConfig>;
}
export declare class PgAuditRepository implements IAuditRepository {
    recordEvent(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent>;
}
