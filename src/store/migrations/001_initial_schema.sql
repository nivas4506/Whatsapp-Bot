-- =========================================================
-- HOD WhatsApp Student Helpdesk Assistant - Initial Schema
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Student Contacts
CREATE TABLE IF NOT EXISTS student_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_contact_id VARCHAR(64) NOT NULL UNIQUE,
    phone_hash VARCHAR(64) NOT NULL,
    consent_state BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_contact_id UUID NOT NULL REFERENCES student_contacts(id) ON DELETE CASCADE,
    state VARCHAR(32) NOT NULL DEFAULT 'NEW',
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_reviewer VARCHAR(128),
    closed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(student_contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_state ON conversations(state);

-- 3. Messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_message_id VARCHAR(128) NOT NULL UNIQUE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction VARCHAR(16) NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'text',
    redacted_content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_provider_id ON messages(provider_message_id);

-- 4. Formal Requirements
CREATE TABLE IF NOT EXISTS requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(64) NOT NULL UNIQUE,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    summary TEXT NOT NULL,
    form_url TEXT,
    form_response_id VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'NEW',
    urgency VARCHAR(16) NOT NULL DEFAULT 'NORMAL',
    assigned_reviewer VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requirements_reference_id ON requirements(reference_id);
CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
CREATE INDEX IF NOT EXISTS idx_requirements_category ON requirements(category);

-- 5. Approved FAQ Knowledge Base
CREATE TABLE IF NOT EXISTS faq_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(64) NOT NULL,
    question_patterns TEXT[] NOT NULL,
    approved_answer TEXT NOT NULL,
    official_url TEXT,
    locale VARCHAR(10) NOT NULL DEFAULT 'en',
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    owner VARCHAR(128) NOT NULL,
    review_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '90 days'
);

-- 6. Form Configurations
CREATE TABLE IF NOT EXISTS form_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(64) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    instructions TEXT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    version VARCHAR(16) NOT NULL DEFAULT '1.0'
);

-- 7. Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_type VARCHAR(32) NOT NULL,
    actor_id VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    correlation_id VARCHAR(128)
);

-- =========================================================
-- Seed Data: Approved Department FAQs & Form Configurations
-- =========================================================

INSERT INTO form_configs (category, url, instructions, status, version)
VALUES 
('CERTIFICATE', 'https://forms.gle/certificate-request-sample', 'Complete this Google Form for Bonafide, Course Completion, or Recommendation certificates. Attach ID card copy.', 'ACTIVE', '1.0'),
('LEAVE', 'https://forms.gle/attendance-leave-sample', 'Complete this form for duty leave or medical leave with medical certificate attached.', 'ACTIVE', '1.0'),
('ATTENDANCE', 'https://forms.gle/attendance-leave-sample', 'Submit an attendance review request. Mention course code and faculty name.', 'ACTIVE', '1.0'),
('EXAMINATION', 'https://forms.gle/universal-student-requirement-sample', 'Report examination clash, re-evaluation, or hall ticket issue.', 'ACTIVE', '1.0'),
('PROJECT_INTERNSHIP', 'https://forms.gle/universal-student-requirement-sample', 'Submit internship NOC or project guide approval details.', 'ACTIVE', '1.0'),
('APPOINTMENT', 'https://forms.gle/hod-appointment-sample', 'Request an official appointment with the HOD. State the purpose clearly.', 'ACTIVE', '1.0'),
('COMPLAINT_GRIEVANCE', 'https://forms.gle/student-grievance-sample', 'Department grievance submission. Handled confidentially by HOD.', 'ACTIVE', '1.0'),
('OTHER_UNKNOWN', 'https://forms.gle/universal-student-requirement-sample', 'Universal student requirement form.', 'ACTIVE', '1.0')
ON CONFLICT (category) DO NOTHING;

INSERT INTO faq_entries (category, question_patterns, approved_answer, official_url, owner)
VALUES
(
    'DEPARTMENT_INFO',
    ARRAY['office hours', 'timing', 'when can i meet hod', 'where is office', 'hod room'],
    'The HOD office is located at Room 304, Academic Block A. Official meeting hours are Monday to Friday, 10:00 AM - 1:00 PM and 2:30 PM - 4:30 PM. For formal meetings, booking via the appointment form is recommended.',
    'https://institution.edu/departments/cse',
    'Department Administration'
),
(
    'CERTIFICATE',
    ARRAY['bonafide', 'certificate', 'study certificate', 'conduct certificate'],
    'To request a Bonafide or Course Certificate, fill out the official certificate request form. Processing takes 2-3 working days upon verification.',
    'https://institution.edu/academic-services',
    'Department Office'
),
(
    'ATTENDANCE',
    ARRAY['attendance shortage', 'shortage of attendance', 'condonation', 'minimum attendance'],
    'As per institutional academic regulations, a minimum of 75% attendance is mandatory in each registered course. Medical condonation up to 10% requires medical certificates submitted within 7 days of absence.',
    'https://institution.edu/regulations/attendance',
    'Academic Committee'
),
(
    'EXAMINATION',
    ARRAY['exam schedule', 'hall ticket', 'revaluation', 'exam clash'],
    'Examination schedules and hall tickets are managed by the Office of the Controller of Examinations (COE). For timetable clashes or hall ticket anomalies, please submit an examination issue form.',
    'https://institution.edu/exam-cell',
    'Controller of Examinations'
),
(
    'PROJECT_INTERNSHIP',
    ARRAY['internship noc', 'project guide', 'internship approval', 'final year project'],
    'Internship NOC and project guide allotments require verification of eligibility and guide consent. Submit the Internship / Project Requirement Form along with your offer letter.',
    'https://institution.edu/cse/internships',
    'Project Coordinator'
),
(
    'FEES_SCHOLARSHIPS',
    ARRAY['fees', 'fee payment', 'scholarship', 'tuition fee'],
    'All fee inquiries, fee concessions, and scholarship disbursals are handled directly by the Accounts Section and Student Welfare Cell. The HOD office does not process fee waivers directly.',
    'https://institution.edu/accounts',
    'Accounts Office'
);
