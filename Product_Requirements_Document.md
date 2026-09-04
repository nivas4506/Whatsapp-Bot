# Product Requirements Document

## WhatsApp Student Helpdesk Assistant for the HOD

**Document status:** Product draft for review  
**Author:** Manus AI  
**Version:** 1.0  
**Date:** 4 September 2026  
**Primary stakeholders:** Head of Department, department administration, student representatives, implementation team

## 1. Executive Summary

The proposed product is a WhatsApp-based student-helpdesk assistant that acts as a first-level agent for the Head of Department (HOD). Students will be able to ask general college and department questions, submit formal requirements, request an appointment, and report issues through a single official WhatsApp channel.

The assistant will provide approved information for routine queries, identify the student’s intent, collect only the details needed to understand the request, and share a Google Form as the final step for formal requests. Form submissions will be recorded for review and routed to the HOD or an assigned department administrator. The assistant must clearly distinguish between automated guidance and matters requiring human review.

The product is intended to reduce repetitive communication for the HOD, improve the quality and completeness of student requests, provide students with a consistent response, and create a searchable record of requirements and follow-up actions.

> **Product principle:** The assistant should make it easier for students to reach the HOD without pretending to be the HOD or making decisions that require institutional authority.

## 2. Problem Statement

Students often contact the HOD with incomplete information, repeated questions, requests sent through different channels, or issues that require several follow-up messages. This creates avoidable administrative work and makes it difficult to track whether each student requirement has been received, understood, and resolved.

The department needs a structured first-contact experience that can answer frequently asked questions, guide students to the correct process, collect complete information through a form, and escalate exceptional or sensitive cases to the HOD.

## 3. Goals and Non-Goals

### 3.1 Goals

| Goal | Description | Success indication |
|---|---|---|
| Provide first-level student support | Answer approved college and department FAQs through WhatsApp. | Students receive a useful response without waiting for the HOD for routine matters. |
| Structure formal requirements | Identify the request type, collect basic context, and share the relevant Google Form at the end. | Submissions contain enough information for review. |
| Reduce repetitive HOD communication | Handle routine questions and direct students to the correct process. | Lower volume of repeated or incomplete messages reaching the HOD. |
| Improve visibility | Record requests and their status in a structured system. | HOD or administrator can find, filter, and follow up on submissions. |
| Preserve human control | Escalate uncertain, urgent, sensitive, or exceptional matters. | No consequential decision is made solely by the assistant. |

### 3.2 Non-Goals for the first release

The first release will not replace the HOD, department office, examination cell, accounts office, or official grievance committee. It will not approve leave, certificates, attendance changes, marks, fee waivers, project topics, or disciplinary actions. It will not provide unofficial answers when the approved information source is incomplete or outdated. It will not operate by reading a personal WhatsApp account; production use requires an official WhatsApp Business Platform/API number or an authorized provider account.

## 4. Users and Roles

| User | Needs | Permissions and responsibilities |
|---|---|---|
| Student | Quick answers, clear instructions, a simple way to submit a requirement, and confirmation that the request was received. | Can ask questions and submit forms. Must provide accurate information and consent to use it for handling the request. |
| HOD | A concise view of student requirements, priority cases, and pending follow-ups. | Reviews escalated matters, makes official decisions, and updates status. |
| Department administrator | Ability to maintain FAQ content, view form responses, categorize requests, and send follow-up messages. | Manages operational workflow under HOD authorization. |
| Content owner | A reliable source for college and department information. | Approves and periodically reviews FAQ content, links, timings, and procedures. |
| System administrator | Stable integrations, access control, logs, and monitoring. | Configures the WhatsApp channel, Google Forms, notifications, and security settings. |

## 5. Product Scope

The assistant will support two primary conversation paths. The first is **information assistance**, in which the student asks a general question and receives an answer from approved FAQ content. The second is **requirement submission**, in which the assistant identifies a formal request, asks a small number of clarifying questions, and shares the appropriate Google Form as the final submission step.

The assistant should support college-level and department-level topics, including office timings, faculty contacts, academic processes, examination procedures, attendance rules, certificates, project or internship guidance, scholarships, fees and administrative directions, campus facilities, complaints, and HOD appointment requests. The exact list will be configured for the department and may differ by institution.

## 6. Core User Experience

### 6.1 Welcome message

When a student starts a conversation, the assistant should introduce itself as the department’s student-helpdesk assistant, explain that it provides general guidance and collects formal requirements, and state that urgent or sensitive matters may be forwarded to the HOD or department staff.

Suggested message:

> Hello. I am the Department Student Helpdesk Assistant. I can help with common college and department queries, guide you to the correct process, and collect requests for review. For formal requests, I will share a Google Form at the end. Please do not share passwords, payment-card details, or highly sensitive personal information in this chat.

### 6.2 General query flow

The student sends a question. The assistant classifies it as a supported FAQ, searches the approved knowledge base, and replies with a concise answer and any relevant official link or contact. If the question is ambiguous, the assistant asks one clarifying question. If no verified answer exists, it should say that the matter requires confirmation and offer to collect it as a requirement through the Google Form.

### 6.3 Formal requirement flow

The student describes a need such as a certificate, attendance issue, exam issue, project approval, complaint, or appointment. The assistant confirms its understanding, asks for the minimum context needed to select the right process, and then shares the relevant Google Form link as the final step. After the student submits the form, the system should provide a confirmation message containing a reference number where available and an approximate response expectation defined by the department.

Suggested final message:

> Thank you. To submit your requirement to the department, please complete this Google Form: **[FORM LINK]**. Please enter your details carefully and attach supporting documents only if requested. After submission, your request will be reviewed by the HOD or the responsible department staff member.

### 6.4 Escalation flow

The assistant must escalate cases involving safety, harassment, discrimination, threats, self-harm, legal disputes, disciplinary action, examination result disputes, confidential records, financial disputes, or any request for an official decision. It should also escalate when the student explicitly asks to speak to the HOD or when the confidence of the classification is low.

The student should receive a transparent response such as:

> This matter requires review by the HOD or department staff. Please complete the form here so that the request can be recorded and routed correctly: **[FORM LINK]**. If there is an immediate safety emergency, contact the institution’s emergency support or local emergency services.

## 7. Functional Requirements

### 7.1 WhatsApp communication

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-01 | The system shall receive incoming student messages through an official WhatsApp Business Platform/API channel or authorized provider. | Must | A test message reaches the application and is logged with timestamp and sender identifier. |
| FR-02 | The system shall send text replies and links to students through the same channel. | Must | A student receives a response linked to the correct conversation. |
| FR-03 | The system shall display a clear welcome message and available help categories. | Must | A new conversation receives the approved welcome message. |
| FR-04 | The system shall support a human handoff request. | Must | “Talk to HOD,” “human,” or equivalent routes the case for human review. |

### 7.2 Query answering

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-05 | The system shall classify messages into supported query categories. | Must | Test messages are assigned to the correct category or marked unknown. |
| FR-06 | The system shall answer only from approved FAQ or department content for routine questions. | Must | Each answer can be traced to an approved content entry. |
| FR-07 | The system shall provide official links, office timings, contact directions, and process instructions when available. | Should | The response includes the current link or contact defined by the content owner. |
| FR-08 | The system shall ask a clarifying question when the request is ambiguous. | Should | The assistant does not send an unrelated form based on a low-confidence classification. |
| FR-09 | The system shall state when it does not know an answer. | Must | Unknown questions receive a safe fallback and an escalation/form option. |

### 7.3 Requirement collection and Google Form handoff

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-10 | The system shall identify formal request categories. | Must | At minimum, the configured categories are available: certificates, leave, attendance, exam issues, project/internship, complaints, and appointments. |
| FR-11 | The system shall collect basic context before sharing the form. | Must | The assistant asks for request type and a short description, without unnecessarily collecting sensitive data. |
| FR-12 | The system shall share the relevant Google Form link at the end of a formal request flow. | Must | The link is correct for the selected category and is presented as the final action. |
| FR-13 | The Google Form shall collect student identity and requirement details. | Must | Form fields include name, register number, department, year/semester, phone number, category, description, and supporting-document field where appropriate. |
| FR-14 | The system shall confirm that the student has been directed to the form. | Must | The student receives a clear next-step message. |
| FR-15 | The system shall record or retrieve form responses for HOD review. | Must | A submitted response appears in the designated response store or notification workflow. |
| FR-16 | The system should generate a request reference number. | Should | The student and HOD can use the same reference when following up. |

### 7.4 HOD and administrator workflow

| ID | Requirement | Priority | Acceptance criteria |
|---|---|---:|---|
| FR-17 | The system shall notify the HOD or designated staff when a form response requires review. | Must | A new response produces a notification in the selected channel. |
| FR-18 | The notification shall contain a concise summary and a link to the full response. | Must | The recipient can understand category, student, urgency, and next action without opening multiple systems. |
| FR-19 | The system shall support request statuses such as New, Under Review, Need More Information, Resolved, and Closed. | Should | Staff can update and filter status. |
| FR-20 | The system shall preserve a conversation or request history for authorized staff. | Should | An authorized reviewer can see the relevant record and timestamps. |
| FR-21 | The system shall permit FAQ and form-link updates without changing the conversation logic. | Should | A content owner can update approved answers and links through the selected management method. |

## 8. Google Form Specification

A single universal form is acceptable for the first release if the department wants a simple launch. Separate forms by category are preferable when different requests require substantially different fields or approvals.

| Field | Type | Required | Purpose |
|---|---|---:|---|
| Student full name | Short answer | Yes | Identify the requester. |
| Register/roll number | Short answer | Yes | Match the request to the student record. |
| Department and programme | Dropdown or short answer | Yes | Route the request. |
| Year and semester | Dropdown | Yes | Provide academic context. |
| Student WhatsApp/mobile number | Short answer | Yes | Enable follow-up. |
| Request category | Dropdown | Yes | Categorize the requirement. |
| Subject or brief title | Short answer | Yes | Create a searchable summary. |
| Detailed requirement | Paragraph | Yes | Capture the complete request. |
| Urgency | Dropdown | No | Help prioritize review; it must not guarantee immediate action. |
| Supporting document | File upload or link | Conditional | Provide evidence when the process requires it. |
| Preferred response method | Dropdown | No | Record student preference. |
| Declaration/consent | Checkbox | Yes | Confirm that the information is accurate and may be used to process the request. |

The form should avoid asking for passwords, banking PINs, full payment-card details, or unrelated sensitive information. Access to responses should be restricted to authorized HOD and department staff.

## 9. Initial FAQ and Requirement Categories

| Category | Example student questions | Default action |
|---|---|---|
| Department information | “What is the HOD office timing?” “Where is the department office?” | Answer from approved FAQ. |
| Faculty and contacts | “Who handles project approval?” | Provide official contact or process direction. |
| Attendance | “I have an attendance shortage.” | Explain policy if approved; share attendance-related form. |
| Examination | “How can I report an exam issue?” | Give official procedure and share exam-issue form. |
| Certificates | “I need a bonafide or course certificate.” | Share certificate-request form. |
| Leave | “How do I apply for leave?” | Explain process and share leave form if applicable. |
| Project and internship | “I need project approval.” | Collect context and share project/internship form. |
| Appointment | “I want to meet the HOD.” | Collect reason and share appointment form. |
| Complaint or grievance | “I want to report a problem.” | Provide respectful guidance, collect form, and escalate. |
| Fees and scholarships | “Where do I ask about fees or scholarships?” | Direct to the authorized office or official page; avoid financial decisions. |
| Unknown or sensitive | Unclear, urgent, confidential, or high-impact matter | Use safe fallback and human escalation. |

## 10. Content and Knowledge Management

The assistant’s answers must come from a controlled information set maintained by the department. The content owner should approve each FAQ entry, its answer, its official source or link, its effective date, and its review date. Outdated information must be disabled rather than silently replaced without review.

The minimum knowledge base should include the department name, HOD name and official role, office location and timings, contact channels, academic calendar link, examination process, attendance policy, certificate process, leave process, project/internship process, grievance route, emergency contacts, and the Google Form link or links.

## 11. Technical and Integration Requirements

The production architecture should use an official WhatsApp Business Platform/API channel or an authorized WhatsApp solution provider. The WhatsApp platform supports receiving events through webhooks and sending messages through its API [1]. Google Forms provides programmatic access to forms and responses, which can support response retrieval and operational tracking [2].

A typical architecture will contain a WhatsApp message receiver, a conversation and classification service, an approved FAQ store, a Google Form link registry, a response and status store, and a notification mechanism for the HOD. For a first release, Google Forms and its response spreadsheet may be sufficient for case storage; a dedicated dashboard can be added later.

| Integration | Purpose | First-release approach |
|---|---|---|
| WhatsApp Business Platform/API or authorized provider | Receive and send messages. | Configure one official department number and verified webhook endpoint. |
| Google Forms | Collect structured student requirements. | Use one universal form or category-specific forms. |
| Google Sheets or response store | Review and track submissions. | Use restricted-access responses with status columns. |
| HOD notification channel | Alert about new or escalated cases. | Choose email, WhatsApp notification, or staff dashboard. |
| FAQ management | Maintain approved answers. | Start with a controlled sheet or admin page. |

## 12. Safety, Privacy, and Human Oversight

The assistant must identify itself as automated and must not imply that a response is an official approval. Official decisions remain with the HOD or authorized institution staff. Students should be told what information is being collected and why. Access to student information must be limited to authorized personnel, and logs should retain only what is necessary for service operation and accountability.

The system must not expose one student’s information to another student. It must not provide confidential academic records, invent policies, guarantee outcomes, or make decisions about marks, attendance exceptions, disciplinary issues, fees, or grievances. High-risk and sensitive messages must be routed to human review. The department should define retention and deletion rules in accordance with its institution’s policy and applicable law.

## 13. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Availability | The service should be available during the department’s published support window, with a fallback message outside that window. |
| Responsiveness | Routine automated replies should normally be delivered within a reasonable conversational delay. |
| Reliability | Incoming messages and form handoffs should be logged, retried safely, and protected against duplicate processing. |
| Security | Secrets must be stored securely; webhook verification, access controls, and least-privilege permissions are required. |
| Maintainability | FAQ content, form links, office timings, and escalation contacts should be configurable. |
| Accessibility | Messages should use simple language, clear labels, and short steps; the form should be usable on mobile devices. |
| Auditability | Staff actions, status changes, and notification events should have timestamps. |
| Scalability | The design should allow more departments, request categories, and staff reviewers later. |

## 14. Metrics and Reporting

The first release should measure whether the service is helping students and reducing administrative effort. Recommended metrics include the number of conversations, FAQ answer rate, unknown-question rate, form-link click or handoff rate where available, form completion rate, duplicate-request rate, human-escalation rate, median response time, time to first staff review, and percentage of requests closed within the department’s target time.

Metrics must be interpreted carefully. A high automation rate is not automatically a success if students receive incorrect answers or cannot reach a human. A successful pilot should combine quantitative metrics with student feedback and HOD review of a sample of conversations.

## 15. Launch Plan

### Phase 1: Preparation

The department confirms the official WhatsApp number, HOD and administrator roles, FAQ content, request categories, Google Form fields, escalation rules, support hours, and notification channel. The department also approves the privacy notice and the wording of automated messages.

### Phase 2: Controlled pilot

The assistant launches for a small group of students or one class. Staff review conversations and form submissions daily. Incorrect answers, missing fields, confusing language, and broken links are corrected before wider release.

### Phase 3: Department rollout

The service is announced through official department channels. The HOD and administrators receive a short operating guide explaining how to review new requirements, change statuses, update FAQs, and take over a conversation.

### Phase 4: Improvement

After the first review period, the department evaluates metrics and feedback. It may add category-specific forms, a dashboard, multilingual responses, appointment scheduling, or integration with an institutional student-information system.

## 16. Acceptance Criteria for Version 1

Version 1 will be considered ready when a student can start a WhatsApp conversation, receive the approved welcome message, ask at least ten representative college or department questions, receive accurate answers for supported FAQs, receive a safe fallback for unknown questions, describe a formal requirement, receive the correct Google Form as the final step, submit the form from a mobile device, and receive a confirmation message.

The HOD or authorized administrator must be able to receive a new-response notification, open the complete response, identify the student and request category, update the request status, and identify escalated cases. The system must demonstrate that an unauthorized user cannot access response data, that duplicate webhook events do not create duplicate cases, and that the assistant does not claim to approve or decide matters reserved for the HOD.

## 17. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Personal WhatsApp account cannot be safely automated | Service may be unreliable or violate platform requirements. | Use an official WhatsApp Business Platform/API number or authorized provider. |
| Outdated FAQ information | Students receive incorrect guidance. | Assign a content owner and enforce review dates. |
| Students do not complete the form | Requests remain incomplete. | Ask for a short summary first, explain why the form is needed, and send a clear final link. |
| Sensitive information is sent in chat | Privacy and safety exposure. | Display a privacy warning, minimize data collection, restrict access, and escalate sensitive cases. |
| HOD receives too many notifications | Important cases may be missed. | Categorize, prioritize, batch non-urgent notifications, and use a staff reviewer. |
| Ambiguous language causes wrong routing | Student frustration or delayed handling. | Use clarifying questions, confidence thresholds, and a human handoff. |
| Incorrect or fabricated AI answer | Institutional and reputational risk. | Restrict answers to approved content and use an explicit “I do not know” fallback. |

## 18. Open Decisions Before Implementation

The department must decide whether to use a new official WhatsApp number or an existing official business number, who will own the WhatsApp account, whether one universal Google Form or multiple category-specific forms will be used, where HOD notifications will be delivered, what response-time expectation will be communicated to students, which languages will be supported, and which institution-approved privacy and data-retention rules apply.

The department should also provide the final Google Form link, department FAQ document, official contacts, office timings, escalation contacts, and list of services. These inputs are required before production configuration.

## References

[1]: https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview "Meta for Developers: WhatsApp Webhooks"

[2]: https://developers.google.com/workspace/forms/api/reference/rest "Google Forms API Reference"
