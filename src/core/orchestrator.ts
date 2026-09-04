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
    inbound: NormalizedInboundMessage
  ): Promise<OrchestrationResponse | null> {
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

    // Handle Greetings / First Contact
    const isGreeting =
      ['hi', 'hello', 'hey', 'start', 'help'].includes(text.toLowerCase().trim()) || isFirstTime;

    if (classification.isEscalated) {
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
    const outboundResult = await whatsappClient.send({
      to: from,
      text: replyText,
      interactiveButtons: interactiveOptions,
      ctaUrl,
    });

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
