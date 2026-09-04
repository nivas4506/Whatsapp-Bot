import crypto from 'crypto';
import { db } from '../db.js';
import {
  StudentContact,
  Conversation,
  StoredMessage,
  RequirementRecord,
  FAQEntry,
  FormConfig,
  AuditEvent,
  ConversationState,
  RequirementCategory,
  RequirementStatus,
  UrgencyLevel,
} from '../../types/index.js';
import {
  IContactRepository,
  IConversationRepository,
  IMessageRepository,
  IRequirementRepository,
  IFAQRepository,
  IFormConfigRepository,
  IAuditRepository,
} from './interfaces.js';

export class PgContactRepository implements IContactRepository {
  async findByPhone(phone: string): Promise<StudentContact | null> {
    const res = await db.query(
      `SELECT id, provider_contact_id as "providerContactId", phone_hash as "phoneHash", 
              consent_state as "consentState", created_at as "createdAt", last_seen_at as "lastSeenAt"
       FROM student_contacts WHERE provider_contact_id = $1`,
      [phone]
    );
    return res.rows[0] || null;
  }

  async upsert(phone: string, consentState: boolean = true): Promise<StudentContact> {
    const phoneHash = crypto.createHash('sha256').update(phone).digest('hex');
    const res = await db.query(
      `INSERT INTO student_contacts (provider_contact_id, phone_hash, consent_state, last_seen_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (provider_contact_id) 
       DO UPDATE SET last_seen_at = NOW(), consent_state = EXCLUDED.consent_state
       RETURNING id, provider_contact_id as "providerContactId", phone_hash as "phoneHash", 
                 consent_state as "consentState", created_at as "createdAt", last_seen_at as "lastSeenAt"`,
      [phone, phoneHash, consentState]
    );
    return res.rows[0];
  }

  async updateLastSeen(id: string): Promise<void> {
    await db.query(`UPDATE student_contacts SET last_seen_at = NOW() WHERE id = $1`, [id]);
  }
}

export class PgConversationRepository implements IConversationRepository {
  async getActiveByContactId(contactId: string): Promise<Conversation | null> {
    const res = await db.query(
      `SELECT id, student_contact_id as "studentContactId", state, locale, 
              last_message_at as "lastMessageAt", assigned_reviewer as "assignedReviewer", closed_at as "closedAt"
       FROM conversations 
       WHERE student_contact_id = $1 AND closed_at IS NULL
       ORDER BY last_message_at DESC LIMIT 1`,
      [contactId]
    );
    return res.rows[0] || null;
  }

  async create(
    contactId: string,
    state: ConversationState = 'NEW',
    locale: string = 'en'
  ): Promise<Conversation> {
    const res = await db.query(
      `INSERT INTO conversations (student_contact_id, state, locale, last_message_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, student_contact_id as "studentContactId", state, locale, 
                 last_message_at as "lastMessageAt", assigned_reviewer as "assignedReviewer", closed_at as "closedAt"`,
      [contactId, state, locale]
    );
    return res.rows[0];
  }

  async updateState(id: string, state: ConversationState): Promise<void> {
    await db.query(
      `UPDATE conversations SET state = $1, last_message_at = NOW() WHERE id = $2`,
      [state, id]
    );
  }

  async close(id: string): Promise<void> {
    await db.query(
      `UPDATE conversations SET state = 'CLOSED', closed_at = NOW(), last_message_at = NOW() WHERE id = $1`,
      [id]
    );
  }

  async assignReviewer(id: string, reviewer: string): Promise<void> {
    await db.query(
      `UPDATE conversations SET assigned_reviewer = $1, last_message_at = NOW() WHERE id = $2`,
      [reviewer, id]
    );
  }
}

export class PgMessageRepository implements IMessageRepository {
  async isMessageProcessed(providerMessageId: string): Promise<boolean> {
    const res = await db.query(
      `SELECT id FROM messages WHERE provider_message_id = $1`,
      [providerMessageId]
    );
    return res.rows.length > 0;
  }

  async recordMessage(
    providerMessageId: string,
    conversationId: string,
    direction: 'INBOUND' | 'OUTBOUND',
    type: string,
    content: string
  ): Promise<StoredMessage> {
    // Redact potential passwords or sensitive 16-digit card strings
    const redacted = content
      .replace(/\b\d{16}\b/g, '[REDACTED_CARD]')
      .replace(/(?:password|pin)\s*[:=]\s*\S+/gi, '$1: [REDACTED]');

    const res = await db.query(
      `INSERT INTO messages (provider_message_id, conversation_id, direction, type, redacted_content, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, provider_message_id as "providerMessageId", conversation_id as "conversationId",
                 direction, type, redacted_content as "redactedContent", created_at as "createdAt"`,
      [providerMessageId, conversationId, direction, type, redacted]
    );
    return res.rows[0];
  }
}

export class PgRequirementRepository implements IRequirementRepository {
  private generateReferenceId(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `HOD-REQ-${dateStr}-${randomCode}`;
  }

  async create(
    conversationId: string,
    category: RequirementCategory,
    summary: string,
    formUrl?: string,
    urgency: UrgencyLevel = 'NORMAL'
  ): Promise<RequirementRecord> {
    const referenceId = this.generateReferenceId();
    const res = await db.query(
      `INSERT INTO requirements (reference_id, conversation_id, category, summary, form_url, status, urgency, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'FORM_PENDING', $6, NOW(), NOW())
       RETURNING id, reference_id as "referenceId", conversation_id as "conversationId", category,
                 summary, form_url as "formUrl", form_response_id as "formResponseId", status,
                 urgency, assigned_reviewer as "assignedReviewer", created_at as "createdAt", updated_at as "updatedAt"`,
      [referenceId, conversationId, category, summary, formUrl || null, urgency]
    );
    return res.rows[0];
  }

  async findById(id: string): Promise<RequirementRecord | null> {
    const res = await db.query(
      `SELECT id, reference_id as "referenceId", conversation_id as "conversationId", category,
              summary, form_url as "formUrl", form_response_id as "formResponseId", status,
              urgency, assigned_reviewer as "assignedReviewer", created_at as "createdAt", updated_at as "updatedAt"
       FROM requirements WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  }

  async findByReferenceId(referenceId: string): Promise<RequirementRecord | null> {
    const res = await db.query(
      `SELECT id, reference_id as "referenceId", conversation_id as "conversationId", category,
              summary, form_url as "formUrl", form_response_id as "formResponseId", status,
              urgency, assigned_reviewer as "assignedReviewer", created_at as "createdAt", updated_at as "updatedAt"
       FROM requirements WHERE reference_id = $1`,
      [referenceId]
    );
    return res.rows[0] || null;
  }

  async updateStatus(
    id: string,
    status: RequirementStatus,
    reviewer?: string
  ): Promise<RequirementRecord | null> {
    const res = await db.query(
      `UPDATE requirements 
       SET status = $1, assigned_reviewer = COALESCE($2, assigned_reviewer), updated_at = NOW()
       WHERE id = $3
       RETURNING id, reference_id as "referenceId", conversation_id as "conversationId", category,
                 summary, form_url as "formUrl", form_response_id as "formResponseId", status,
                 urgency, assigned_reviewer as "assignedReviewer", created_at as "createdAt", updated_at as "updatedAt"`,
      [status, reviewer || null, id]
    );
    return res.rows[0] || null;
  }

  async linkFormResponse(
    referenceId: string,
    formResponseId: string
  ): Promise<RequirementRecord | null> {
    const res = await db.query(
      `UPDATE requirements
       SET form_response_id = $1, status = 'SUBMITTED', updated_at = NOW()
       WHERE reference_id = $2
       RETURNING id, reference_id as "referenceId", conversation_id as "conversationId", category,
                 summary, form_url as "formUrl", form_response_id as "formResponseId", status,
                 urgency, assigned_reviewer as "assignedReviewer", created_at as "createdAt", updated_at as "updatedAt"`,
      [formResponseId, referenceId]
    );
    return res.rows[0] || null;
  }

  async list(filters?: {
    status?: RequirementStatus;
    category?: RequirementCategory;
    limit?: number;
    offset?: number;
  }): Promise<RequirementRecord[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIdx = 1;

    if (filters?.status) {
      conditions.push(`status = $${paramIdx++}`);
      params.push(filters.status);
    }
    if (filters?.category) {
      conditions.push(`category = $${paramIdx++}`);
      params.push(filters.category);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    params.push(limit, offset);

    const query = `
      SELECT id, reference_id as "referenceId", conversation_id as "conversationId", category,
             summary, form_url as "formUrl", form_response_id as "formResponseId", status,
             urgency, assigned_reviewer as "assignedReviewer", created_at as "createdAt", updated_at as "updatedAt"
      FROM requirements
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const res = await db.query(query, params);
    return res.rows;
  }
}

export class PgFAQRepository implements IFAQRepository {
  async findMatching(query: string, locale: string = 'en'): Promise<FAQEntry | null> {
    const normalized = query.toLowerCase();
    const res = await db.query(
      `SELECT id, category, question_patterns as "questionPatterns", approved_answer as "approvedAnswer",
              official_url as "officialUrl", locale, status, owner, review_date as "reviewDate"
       FROM faq_entries 
       WHERE status = 'ACTIVE' AND locale = $1`,
      [locale]
    );

    for (const entry of res.rows) {
      const patterns: string[] = entry.questionPatterns || [];
      for (const pattern of patterns) {
        if (normalized.includes(pattern.toLowerCase())) {
          return entry;
        }
      }
    }

    return null;
  }

  async listActive(locale: string = 'en'): Promise<FAQEntry[]> {
    const res = await db.query(
      `SELECT id, category, question_patterns as "questionPatterns", approved_answer as "approvedAnswer",
              official_url as "officialUrl", locale, status, owner, review_date as "reviewDate"
       FROM faq_entries WHERE status = 'ACTIVE' AND locale = $1`,
      [locale]
    );
    return res.rows;
  }
}

export class PgFormConfigRepository implements IFormConfigRepository {
  async getByCategory(category: RequirementCategory): Promise<FormConfig | null> {
    const res = await db.query(
      `SELECT id, category, url, instructions, status, effective_from as "effectiveFrom", 
              effective_to as "effectiveTo", version
       FROM form_configs WHERE category = $1 AND status = 'ACTIVE' LIMIT 1`,
      [category]
    );
    return res.rows[0] || null;
  }

  async getDefault(): Promise<FormConfig> {
    const res = await db.query(
      `SELECT id, category, url, instructions, status, effective_from as "effectiveFrom", 
              effective_to as "effectiveTo", version
       FROM form_configs WHERE category = 'OTHER_UNKNOWN' AND status = 'ACTIVE' LIMIT 1`
    );
    return res.rows[0] || {
      id: 'default',
      category: 'OTHER_UNKNOWN',
      url: 'https://forms.gle/universal-student-requirement-sample',
      instructions: 'Universal student requirement submission form.',
      status: 'ACTIVE',
      version: '1.0'
    };
  }
}

export class PgAuditRepository implements IAuditRepository {
  async recordEvent(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent> {
    const res = await db.query(
      `INSERT INTO audit_events (actor_type, actor_id, action, entity_type, entity_id, correlation_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, actor_type as "actorType", actor_id as "actorId", action, entity_type as "entityType",
                 entity_id as "entityId", created_at as "createdAt", correlation_id as "correlationId"`,
      [
        event.actorType,
        event.actorId,
        event.action,
        event.entityType,
        event.entityId,
        event.correlationId || null,
      ]
    );
    return res.rows[0];
  }
}
