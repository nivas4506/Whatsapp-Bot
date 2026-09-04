export type ConversationState =
  | 'NEW'
  | 'UNDERSTANDING'
  | 'FAQ_ANSWERING'
  | 'REQUIREMENT_INTAKE'
  | 'FORM_PENDING'
  | 'HUMAN_REVIEW'
  | 'CLOSED';

export type RequirementCategory =
  | 'DEPARTMENT_INFO'
  | 'FACULTY_CONTACT'
  | 'ATTENDANCE'
  | 'EXAMINATION'
  | 'CERTIFICATE'
  | 'LEAVE'
  | 'PROJECT_INTERNSHIP'
  | 'APPOINTMENT'
  | 'COMPLAINT_GRIEVANCE'
  | 'FEES_SCHOLARSHIPS'
  | 'OTHER_UNKNOWN';

export type RequirementStatus =
  | 'NEW'
  | 'FORM_PENDING'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEED_MORE_INFORMATION'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'CLOSED';

export type UrgencyLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface StudentContact {
  id: string;
  providerContactId: string; // WhatsApp Phone number e.g. "919876543210"
  phoneHash: string;
  consentState: boolean;
  createdAt: Date;
  lastSeenAt: Date;
}

export interface Conversation {
  id: string;
  studentContactId: string;
  state: ConversationState;
  locale: string;
  lastMessageAt: Date;
  assignedReviewer?: string | null;
  closedAt?: Date | null;
}

export interface StoredMessage {
  id: string;
  providerMessageId: string;
  conversationId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  type: string;
  redactedContent: string;
  createdAt: Date;
}

export interface RequirementRecord {
  id: string;
  referenceId: string; // e.g. HOD-REQ-20260905-ABCD
  conversationId: string;
  category: RequirementCategory;
  summary: string;
  formUrl?: string | null;
  formResponseId?: string | null;
  status: RequirementStatus;
  urgency: UrgencyLevel;
  assignedReviewer?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FAQEntry {
  id: string;
  category: RequirementCategory;
  questionPatterns: string[];
  approvedAnswer: string;
  officialUrl?: string | null;
  locale: string;
  status: 'ACTIVE' | 'ARCHIVED';
  owner: string;
  reviewDate: string; // YYYY-MM-DD
}

export interface FormConfig {
  id: string;
  category: RequirementCategory;
  url: string;
  instructions: string;
  status: 'ACTIVE' | 'INACTIVE';
  effectiveFrom?: string;
  effectiveTo?: string;
  version: string;
}

export interface AuditEvent {
  id: string;
  actorType: 'STUDENT' | 'SYSTEM' | 'HOD' | 'ADMIN';
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: Date;
  correlationId?: string | null;
}

export interface NormalizedInboundMessage {
  providerMessageId: string;
  from: string; // E.164 phone number
  timestamp: Date;
  text: string;
  type: 'text' | 'button_reply' | 'quick_reply' | 'unsupported';
  interactiveId?: string;
}

export interface ClassificationResult {
  category: RequirementCategory;
  intent: 'FAQ' | 'FORMAL_REQUIREMENT' | 'ESCALATION' | 'UNCLEAR';
  confidence: number; // 0.0 to 1.0
  urgency: UrgencyLevel;
  isEscalated: boolean;
  escalationReason?: string;
}

export interface OrchestrationResponse {
  conversationId: string;
  nextState: ConversationState;
  replyText: string;
  interactiveOptions?: Array<{ id: string; title: string }>;
  ctaUrl?: { title: string; url: string };
  referenceId?: string;
}
