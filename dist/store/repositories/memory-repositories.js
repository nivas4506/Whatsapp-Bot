import crypto from 'crypto';
export class MemoryContactRepository {
    contacts = new Map();
    async findByPhone(phone) {
        for (const c of this.contacts.values()) {
            if (c.providerContactId === phone)
                return c;
        }
        return null;
    }
    async upsert(phone, consentState = true) {
        let existing = await this.findByPhone(phone);
        if (existing) {
            existing.lastSeenAt = new Date();
            existing.consentState = consentState;
            return existing;
        }
        const newContact = {
            id: crypto.randomUUID(),
            providerContactId: phone,
            phoneHash: crypto.createHash('sha256').update(phone).digest('hex'),
            consentState,
            createdAt: new Date(),
            lastSeenAt: new Date(),
        };
        this.contacts.set(newContact.id, newContact);
        return newContact;
    }
    async updateLastSeen(id) {
        const contact = this.contacts.get(id);
        if (contact)
            contact.lastSeenAt = new Date();
    }
}
export class MemoryConversationRepository {
    conversations = new Map();
    async getActiveByContactId(contactId) {
        const list = Array.from(this.conversations.values())
            .filter((c) => c.studentContactId === contactId && !c.closedAt)
            .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
        return list[0] || null;
    }
    async create(contactId, state = 'NEW', locale = 'en') {
        const newConv = {
            id: crypto.randomUUID(),
            studentContactId: contactId,
            state,
            locale,
            lastMessageAt: new Date(),
        };
        this.conversations.set(newConv.id, newConv);
        return newConv;
    }
    async updateState(id, state) {
        const conv = this.conversations.get(id);
        if (conv) {
            conv.state = state;
            conv.lastMessageAt = new Date();
        }
    }
    async close(id) {
        const conv = this.conversations.get(id);
        if (conv) {
            conv.state = 'CLOSED';
            conv.closedAt = new Date();
            conv.lastMessageAt = new Date();
        }
    }
    async assignReviewer(id, reviewer) {
        const conv = this.conversations.get(id);
        if (conv) {
            conv.assignedReviewer = reviewer;
            conv.lastMessageAt = new Date();
        }
    }
}
export class MemoryMessageRepository {
    messages = new Map();
    async isMessageProcessed(providerMessageId) {
        for (const m of this.messages.values()) {
            if (m.providerMessageId === providerMessageId)
                return true;
        }
        return false;
    }
    async recordMessage(providerMessageId, conversationId, direction, type, content) {
        const redacted = content
            .replace(/\b\d{16}\b/g, '[REDACTED_CARD]')
            .replace(/(?:password|pin)\s*[:=]\s*\S+/gi, '$1: [REDACTED]');
        const msg = {
            id: crypto.randomUUID(),
            providerMessageId,
            conversationId,
            direction,
            type,
            redactedContent: redacted,
            createdAt: new Date(),
        };
        this.messages.set(msg.id, msg);
        return msg;
    }
}
export class MemoryRequirementRepository {
    requirements = new Map();
    generateReferenceId() {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        return `HOD-REQ-${dateStr}-${randomCode}`;
    }
    async create(conversationId, category, summary, formUrl, urgency = 'NORMAL') {
        const req = {
            id: crypto.randomUUID(),
            referenceId: this.generateReferenceId(),
            conversationId,
            category,
            summary,
            formUrl: formUrl || null,
            status: 'FORM_PENDING',
            urgency,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.requirements.set(req.id, req);
        return req;
    }
    async findById(id) {
        return this.requirements.get(id) || null;
    }
    async findByReferenceId(referenceId) {
        for (const r of this.requirements.values()) {
            if (r.referenceId === referenceId)
                return r;
        }
        return null;
    }
    async updateStatus(id, status, reviewer) {
        const req = this.requirements.get(id);
        if (!req)
            return null;
        req.status = status;
        if (reviewer)
            req.assignedReviewer = reviewer;
        req.updatedAt = new Date();
        return req;
    }
    async linkFormResponse(referenceId, formResponseId) {
        const req = await this.findByReferenceId(referenceId);
        if (!req)
            return null;
        req.formResponseId = formResponseId;
        req.status = 'SUBMITTED';
        req.updatedAt = new Date();
        return req;
    }
    async list(filters) {
        let list = Array.from(this.requirements.values());
        if (filters?.status)
            list = list.filter((r) => r.status === filters.status);
        if (filters?.category)
            list = list.filter((r) => r.category === filters.category);
        list.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        const offset = filters?.offset || 0;
        const limit = filters?.limit || 50;
        return list.slice(offset, offset + limit);
    }
}
export class MemoryFAQRepository {
    entries = [
        {
            id: 'faq-1',
            category: 'DEPARTMENT_INFO',
            questionPatterns: ['office hours', 'timing', 'when can i meet hod', 'where is office', 'hod room'],
            approvedAnswer: 'The HOD office is located at Room 304, Academic Block A. Official meeting hours are Monday to Friday, 10:00 AM - 1:00 PM and 2:30 PM - 4:30 PM. For formal meetings, booking via the appointment form is recommended.',
            officialUrl: 'https://institution.edu/departments/cse',
            locale: 'en',
            status: 'ACTIVE',
            owner: 'Department Administration',
            reviewDate: '2026-12-31',
        },
        {
            id: 'faq-2',
            category: 'CERTIFICATE',
            questionPatterns: ['bonafide', 'certificate', 'study certificate', 'conduct certificate'],
            approvedAnswer: 'To request a Bonafide or Course Certificate, fill out the official certificate request form. Processing takes 2-3 working days upon verification.',
            officialUrl: 'https://institution.edu/academic-services',
            locale: 'en',
            status: 'ACTIVE',
            owner: 'Department Office',
            reviewDate: '2026-12-31',
        },
        {
            id: 'faq-3',
            category: 'ATTENDANCE',
            questionPatterns: ['attendance shortage', 'shortage of attendance', 'condonation', 'minimum attendance'],
            approvedAnswer: 'As per institutional academic regulations, a minimum of 75% attendance is mandatory in each registered course. Medical condonation up to 10% requires medical certificates submitted within 7 days of absence.',
            officialUrl: 'https://institution.edu/regulations/attendance',
            locale: 'en',
            status: 'ACTIVE',
            owner: 'Academic Committee',
            reviewDate: '2026-12-31',
        },
        {
            id: 'faq-4',
            category: 'EXAMINATION',
            questionPatterns: ['exam schedule', 'hall ticket', 'revaluation', 'exam clash'],
            approvedAnswer: 'Examination schedules and hall tickets are managed by the Office of the Controller of Examinations (COE). For timetable clashes or hall ticket anomalies, please submit an examination issue form.',
            officialUrl: 'https://institution.edu/exam-cell',
            locale: 'en',
            status: 'ACTIVE',
            owner: 'Controller of Examinations',
            reviewDate: '2026-12-31',
        },
        {
            id: 'faq-5',
            category: 'PROJECT_INTERNSHIP',
            questionPatterns: ['internship noc', 'project guide', 'internship approval', 'final year project'],
            approvedAnswer: 'Internship NOC and project guide allotments require verification of eligibility and guide consent. Submit the Internship / Project Requirement Form along with your offer letter.',
            officialUrl: 'https://institution.edu/cse/internships',
            locale: 'en',
            status: 'ACTIVE',
            owner: 'Project Coordinator',
            reviewDate: '2026-12-31',
        },
        {
            id: 'faq-6',
            category: 'FEES_SCHOLARSHIPS',
            questionPatterns: ['fees', 'fee payment', 'scholarship', 'tuition fee'],
            approvedAnswer: 'All fee inquiries, fee concessions, and scholarship disbursals are handled directly by the Accounts Section and Student Welfare Cell. The HOD office does not process fee waivers directly.',
            officialUrl: 'https://institution.edu/accounts',
            locale: 'en',
            status: 'ACTIVE',
            owner: 'Accounts Office',
            reviewDate: '2026-12-31',
        },
    ];
    async findMatching(query, locale = 'en') {
        const normalized = query.toLowerCase();
        for (const entry of this.entries) {
            if (entry.status !== 'ACTIVE' || entry.locale !== locale)
                continue;
            for (const p of entry.questionPatterns) {
                if (normalized.includes(p.toLowerCase()))
                    return entry;
            }
        }
        return null;
    }
    async listActive(locale = 'en') {
        return this.entries.filter((e) => e.status === 'ACTIVE' && e.locale === locale);
    }
}
export class MemoryFormConfigRepository {
    configs = new Map([
        [
            'CERTIFICATE',
            {
                id: 'cfg-cert',
                category: 'CERTIFICATE',
                url: 'https://forms.gle/certificate-request-sample',
                instructions: 'Complete this Google Form for Bonafide, Course Completion, or Recommendation certificates.',
                status: 'ACTIVE',
                version: '1.0',
            },
        ],
        [
            'ATTENDANCE',
            {
                id: 'cfg-att',
                category: 'ATTENDANCE',
                url: 'https://forms.gle/attendance-leave-sample',
                instructions: 'Submit an attendance review request. Mention course code and faculty name.',
                status: 'ACTIVE',
                version: '1.0',
            },
        ],
        [
            'LEAVE',
            {
                id: 'cfg-leave',
                category: 'LEAVE',
                url: 'https://forms.gle/attendance-leave-sample',
                instructions: 'Complete this form for duty leave or medical leave with medical certificate attached.',
                status: 'ACTIVE',
                version: '1.0',
            },
        ],
        [
            'APPOINTMENT',
            {
                id: 'cfg-app',
                category: 'APPOINTMENT',
                url: 'https://forms.gle/hod-appointment-sample',
                instructions: 'Request an official appointment with the HOD. State the purpose clearly.',
                status: 'ACTIVE',
                version: '1.0',
            },
        ],
        [
            'COMPLAINT_GRIEVANCE',
            {
                id: 'cfg-griev',
                category: 'COMPLAINT_GRIEVANCE',
                url: 'https://forms.gle/student-grievance-sample',
                instructions: 'Department grievance submission. Handled confidentially by HOD.',
                status: 'ACTIVE',
                version: '1.0',
            },
        ],
        [
            'OTHER_UNKNOWN',
            {
                id: 'cfg-default',
                category: 'OTHER_UNKNOWN',
                url: 'https://forms.gle/universal-student-requirement-sample',
                instructions: 'Universal student requirement submission form.',
                status: 'ACTIVE',
                version: '1.0',
            },
        ],
    ]);
    async getByCategory(category) {
        return this.configs.get(category) || null;
    }
    async getDefault() {
        return this.configs.get('OTHER_UNKNOWN');
    }
}
export class MemoryAuditRepository {
    events = [];
    async recordEvent(event) {
        const fullEvent = {
            id: crypto.randomUUID(),
            ...event,
            createdAt: new Date(),
        };
        this.events.push(fullEvent);
        return fullEvent;
    }
}
