import { config } from '../config/index.js';
import { checkSupportHours } from '../config/support-hours.js';
import { repositories } from '../store/repositories/index.js';
import { MessageClassifier } from './classifier.js';
import { ConversationStateMachine } from './state-machine.js';
import { faqService } from '../services/faq-service.js';
import { formRegistry } from '../services/form-registry.js';
import { notificationService } from '../services/notification-service.js';
import { whatsappClient } from '../adapters/whatsapp/client.js';
import {
  NormalizedInboundMessage,
  OrchestrationResponse,
  ConversationState,
  RequirementRecord,
} from '../types/index.js';

export class ConversationOrchestrator {
  async processInboundMessage(
    inbound: NormalizedInboundMessage,
    options: { dispatchOutbound?: boolean } = {}
  ): Promise<OrchestrationResponse | null> {
    const dispatchOutbound = options.dispatchOutbound ?? true;
    const { from, providerMessageId, text, type } = inbound;

    // 1. Idempotency Check: Prevent duplicate processing of retried webhook events
    const alreadyProcessed = await repositories.messages.isMessageProcessed(providerMessageId);
    if (alreadyProcessed) {
      console.warn(`[Orchestrator] Message ${providerMessageId} already processed. Skipping.`);
      return null;
    }

    // 2. Identify or Create Student Contact
    const contact = await repositories.contacts.upsert(from, true);

    // 3. Retrieve or Initialize Active Conversation
    let conversation = await repositories.conversations.getActiveByContactId(contact.id);
    const isFirstTime = !conversation;

    if (!conversation) {
      conversation = await repositories.conversations.create(contact.id, 'NEW');
    }

    // Record Inbound Message
    await repositories.messages.recordMessage(
      providerMessageId,
      conversation.id,
      'INBOUND',
      type,
      text
    );

    // 4. Support Hours Check
    const hoursStatus = checkSupportHours();

    // 5. Intent and Risk Classification
    const classification = MessageClassifier.classify(text);

    let nextState: ConversationState = conversation.state;
    let replyText = '';
    let ctaUrl: { title: string; url: string } | undefined;
    let interactiveOptions: Array<{ id: string; title: string }> | undefined;
    let referenceId: string | undefined;

    // Zero-Dashboard WhatsApp Management: HOD In-Chat Commands & Student Status Tracking
    const cleanFrom = from.replace(/\D/g, '');
    const cleanHOD = config.HOD_WHATSAPP_NUMBER ? config.HOD_WHATSAPP_NUMBER.replace(/\D/g, '') : '';
    const isSenderHOD = Boolean(cleanHOD && cleanFrom === cleanHOD);

    const trimmed = text.trim();
    const upper = trimmed.toUpperCase();
    const refMatch = upper.match(/HOD-REQ-\d{8}-[A-Z0-9]+/i);
    const isStatusQuery = (upper.startsWith('STATUS') || upper.startsWith('TRACK')) && refMatch;
    const isDirectRef = Boolean(refMatch && trimmed.length <= 32);
    const isGreeting = ['hi', 'hello', 'hey', 'start', 'help'].includes(text.toLowerCase().trim());

    if (isSenderHOD && (upper === 'LIST' || upper === 'PENDING')) {
      // HOD Command: List pending items
      const list = await repositories.requirements.list({ limit: 10 });
      const openItems = list.filter((r) => r.status !== 'RESOLVED' && r.status !== 'CLOSED');

      if (openItems.length === 0) {
        replyText = `📋 *HOD Desk: Pending Requests*\n\nAll caught up! There are currently *0 open student requirements*.`;
      } else {
        replyText =
          `📋 *Pending Student Requests (${openItems.length}):*\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          openItems
            .slice(0, 5)
            .map(
              (r, i) =>
                `*${i + 1}. ${r.referenceId}* [${r.category.replace(/_/g, ' ')}]\n` +
                `• Urgency: *${r.urgency}* | Status: ${r.status}\n` +
                `• Issue: "${r.summary.slice(0, 50)}${r.summary.length > 50 ? '...' : ''}"\n` +
                `• Form: ${r.formResponseId ? 'Submitted & Linked ✅' : 'Awaiting Submission ⏳'}`
            )
            .join('\n\n') +
          `\n━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `_Actions: Reply \`APPROVE <REF> [note]\` or \`REJECT <REF> [reason]\`_`;
      }
    } else if (isSenderHOD && upper === 'HELP') {
      replyText =
        `🎓 *HOD Executive WhatsApp Desk*\n\n` +
        `You can manage student requests entirely via WhatsApp:\n` +
        `• \`PENDING\` or \`LIST\` — View open student requirements\n` +
        `• \`APPROVE <REF> [note]\` — Approve request & auto-notify student\n` +
        `• \`REJECT <REF> [reason]\` — Reject request & auto-notify student\n` +
        `• \`STATUS <REF>\` — View details of a specific request`;
    } else if (isSenderHOD && upper.startsWith('APPROVE ')) {
      const parts = trimmed.split(/\s+/);
      const targetRef = parts[1]?.toUpperCase();
      const note = parts.slice(2).join(' ');

      const req = await repositories.requirements.findByReferenceId(targetRef);
      if (!req) {
        replyText = `❌ Requirement with Reference *${targetRef}* was not found.`;
      } else {
        await repositories.requirements.updateStatus(req.id, 'RESOLVED', config.HOD_DISPLAY_NAME);

        // Notify student on WhatsApp
        try {
          const conv = await repositories.conversations.findById(req.conversationId);
          if (conv) {
            const student = await repositories.contacts.findById(conv.studentContactId);
            if (student) {
              await whatsappClient.send({
                to: student.providerContactId,
                text:
                  `🎉 *Good News! Update on Ref ${req.referenceId}*\n\n` +
                  `Your request for *${req.category.replace(/_/g, ' ')}* has been *APPROVED* by ${config.HOD_DISPLAY_NAME}.\n` +
                  (note ? `\n📝 *HOD Note*: ${note}\n` : '') +
                  `\nYou may visit the department office during office hours to collect any approved certificates or official paperwork.`,
              });
            }
          }
        } catch (err: any) {
          console.error('[Orchestrator] Error notifying student of approval:', err.message);
        }

        replyText = `✅ *Request Approved*\nReference *${targetRef}* has been marked as RESOLVED and the student was notified directly on WhatsApp.`;
      }
    } else if (isSenderHOD && upper.startsWith('REJECT ')) {
      const parts = trimmed.split(/\s+/);
      const targetRef = parts[1]?.toUpperCase();
      const reason = parts.slice(2).join(' ');

      const req = await repositories.requirements.findByReferenceId(targetRef);
      if (!req) {
        replyText = `❌ Requirement with Reference *${targetRef}* was not found.`;
      } else {
        await repositories.requirements.updateStatus(req.id, 'CLOSED', config.HOD_DISPLAY_NAME);

        // Notify student on WhatsApp
        try {
          const conv = await repositories.conversations.findById(req.conversationId);
          if (conv) {
            const student = await repositories.contacts.findById(conv.studentContactId);
            if (student) {
              await whatsappClient.send({
                to: student.providerContactId,
                text:
                  `⚠️ *Update on Department Request ${req.referenceId}*\n\n` +
                  `Your request for *${req.category.replace(/_/g, ' ')}* could not be approved at this time.\n` +
                  (reason ? `\n📝 *Remarks*: ${reason}\n` : '') +
                  `\nPlease consult with the department office or your academic advisor during scheduled office hours.`,
              });
            }
          }
        } catch (err: any) {
          console.error('[Orchestrator] Error notifying student of rejection:', err.message);
        }

        replyText = `❌ *Request Rejected*\nReference *${targetRef}* was closed and student was notified directly on WhatsApp.`;
      }
    } else if (isStatusQuery || isDirectRef) {
      const targetRef = refMatch ? refMatch[0].toUpperCase() : '';
      const req = await repositories.requirements.findByReferenceId(targetRef);

      if (!req) {
        replyText = `❌ No record found for Reference ID *${targetRef}*. Please verify your reference number.`;
      } else {
        replyText =
          `📌 *Requirement Status: ${req.referenceId}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `• *Category:* ${req.category.replace(/_/g, ' ')}\n` +
          `• *Status:* ${req.status}\n` +
          `• *Urgency:* ${req.urgency}\n` +
          `• *Department Form:* ${req.formResponseId ? 'Submitted & Linked ✅' : 'Pending Submission ⏳'}\n` +
          `• *Logged At:* ${new Date(req.createdAt).toLocaleString()}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          (req.formResponseId
            ? `Your submission is currently under review by the department.`
            : `Please make sure to complete your form here: ${req.formUrl || config.DEFAULT_GOOGLE_FORM_URL}`);
      }
    } else if (classification.isEscalated) {
      // -------------------------------------------------------------
      // PATH A: High Risk / Explicit Escalation to HOD
      // -------------------------------------------------------------
      nextState = 'HUMAN_REVIEW';
      ConversationStateMachine.assertValidTransition(conversation.state, nextState);

      const formConfig = await formRegistry.resolveForm(classification.category);
      const req = await repositories.requirements.create(
        conversation.id,
        classification.category,
        text,
        formConfig.url,
        classification.urgency
      );
      referenceId = req.referenceId;

      await notificationService.notifyHOD({
        referenceId: req.referenceId,
        category: classification.category,
        urgency: classification.urgency,
        summary: text,
        senderPhoneHash: contact.phoneHash,
        reason: classification.escalationReason,
      });

      replyText =
        `⚠️ *Department Notice: Case Escalated for Review*\n\n` +
        `This matter requires official review by the HOD (${config.HOD_DISPLAY_NAME}) or designated staff.\n\n` +
        `Your case reference: *${req.referenceId}*\n\n` +
        `Please complete the official department review form so all details are logged:\n` +
        `${formConfig.url}\n\n` +
        `_If you are experiencing an immediate safety emergency, please contact campus security or emergency services directly._`;

      ctaUrl = {
        title: 'Submit Review Form',
        url: formConfig.url,
      };
    } else if (isGreeting && conversation.state === 'NEW') {
      // -------------------------------------------------------------
      // PATH B: Welcome & First-time Guidance
      // -------------------------------------------------------------
      nextState = 'UNDERSTANDING';
      replyText =
        `Hello! Welcome to the official *${config.DEPARTMENT_NAME} Student Helpdesk*.\n\n` +
        `I am the automated first-level assistant for ${config.HOD_DISPLAY_NAME}. I can answer approved department questions and assist with formal requests.\n\n` +
        `🔒 *Privacy Notice*: Please do NOT share passwords, bank details, or confidential personal data in this chat.\n\n` +
        `How may I assist you today? You can ask about:\n` +
        `• HOD Office Hours & Meeting Timings\n` +
        `• Bonafide & Course Certificates\n` +
        `• Attendance & Leave Rules\n` +
        `• Exam Clashes & Revaluation\n` +
        `• Project & Internship Approval`;

      interactiveOptions = [
        { id: 'opt_office_hours', title: 'HOD Office Hours' },
        { id: 'opt_certificate', title: 'Need Certificate' },
        { id: 'opt_leave', title: 'Attendance / Leave' },
      ];
    } else if (classification.intent === 'FAQ') {
      // -------------------------------------------------------------
      // PATH C: Approved FAQ Response
      // -------------------------------------------------------------
      const faq = await faqService.getAnswer(text, conversation.locale);

      if (faq) {
        nextState = 'FAQ_ANSWERING';
        replyText =
          `ℹ️ *${faq.category.replace('_', ' ')}*\n\n` +
          `${faq.approvedAnswer}\n\n` +
          (faq.officialUrl ? `🔗 Official Link: ${faq.officialUrl}\n\n` : '') +
          `_Need to submit a formal request or meet the HOD? Reply with details or type "Form"._`;
      } else {
        // Fallback for missing specific FAQ
        nextState = 'UNDERSTANDING';
        replyText =
          `I don't have a verified FAQ answer for that specific query. \n\n` +
          `If this requires institutional attention, please describe your requirement (e.g. certificate, attendance, appointment, or exam issue), and I will generate your formal submission form.`;
      }
    } else if (classification.intent === 'FORMAL_REQUIREMENT') {
      // -------------------------------------------------------------
      // PATH D: Formal Student Requirement & Google Form Handoff
      // -------------------------------------------------------------
      nextState = 'FORM_PENDING';
      const formConfig = await formRegistry.resolveForm(classification.category);

      const req: RequirementRecord = await repositories.requirements.create(
        conversation.id,
        classification.category,
        text,
        formConfig.url,
        classification.urgency
      );
      referenceId = req.referenceId;

      await notificationService.notifyNewRequirement(req);

      replyText =
        `📋 *Formal Requirement Recorded*\n\n` +
        `Thank you. To submit your *${classification.category.replace('_', ' ')}* request to the department, please complete the official Google Form.\n\n` +
        `📌 *Reference Number:* ${req.referenceId}\n` +
        `*(Save this reference number for follow-up)*\n\n` +
        `📝 *Form Link:* ${formConfig.url}\n\n` +
        `ℹ️ _Instructions_: ${formConfig.instructions}\n\n` +
        `After you submit the form, your request will be reviewed by the HOD or department office during working hours.`;

      ctaUrl = {
        title: 'Open Google Form',
        url: formConfig.url,
      };
    } else {
      // -------------------------------------------------------------
      // PATH E: Unclear / Clarification
      // -------------------------------------------------------------
      nextState = 'UNDERSTANDING';
      replyText =
        `Could you please clarify your request? \n\n` +
        `You can reply with one of the following:\n` +
        `1. Ask for *Office Hours* or *Faculty Contacts*\n` +
        `2. Request a *Bonafide Certificate*\n` +
        `3. Report an *Attendance Issue* or apply for *Leave*\n` +
        `4. Request an *Appointment with the HOD*\n` +
        `5. Or type *Talk to HOD* to request human review.`;
    }

    // Append out-of-hours note if applicable
    if (!hoursStatus.isWithinHours && hoursStatus.message) {
      replyText += `\n\n🕒 _${hoursStatus.message}_`;
    }

    // 6. Update Conversation State in Database
    await repositories.conversations.updateState(conversation.id, nextState);

    // 7. Dispatch Outbound Message via WhatsApp Client
    const outboundResult = dispatchOutbound
      ? await whatsappClient.send({
          to: from,
          text: replyText,
          interactiveButtons: interactiveOptions,
          ctaUrl,
        })
      : { success: true, messageId: `web_out_${providerMessageId}` };

    // 8. Record Outbound Message in DB
    await repositories.messages.recordMessage(
      outboundResult.messageId,
      conversation.id,
      'OUTBOUND',
      ctaUrl ? 'interactive_cta' : interactiveOptions ? 'interactive_button' : 'text',
      replyText
    );

    // 9. Record Audit Event
    await repositories.audit.recordEvent({
      actorType: 'SYSTEM',
      actorId: 'whatsapp-bot',
      action: 'PROCESS_MESSAGE',
      entityType: 'CONVERSATION',
      entityId: conversation.id,
      correlationId: providerMessageId,
    });

    return {
      conversationId: conversation.id,
      nextState,
      replyText,
      interactiveOptions,
      ctaUrl,
      referenceId,
    };
  }
}

export const orchestrator = new ConversationOrchestrator();
