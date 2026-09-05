import { Router, Request, Response } from 'express';
import { repositories } from '../store/repositories/index.js';
import { notificationService } from '../services/notification-service.js';
import { whatsappClient } from '../adapters/whatsapp/client.js';

export const formsSyncRouter = Router();

/**
 * POST /internal/forms/responses/sync
 * Correlates an external Google Form submission with a student's requirement record
 */
formsSyncRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { referenceId, formResponseId, phone, name, email, query } = req.body;

    if (!formResponseId) {
      res.status(400).json({ error: 'formResponseId is required' });
      return;
    }

    let updated = null;

    // Strategy 1: Direct link by referenceId (e.g. HOD-REQ-...)
    if (referenceId) {
      updated = await repositories.requirements.linkFormResponse(referenceId.trim(), formResponseId);
    }

    // Strategy 2: Fallback link by student phone number if referenceId was not entered
    if (!updated && phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const contact = await repositories.contacts.findByPhone(cleanPhone);
      if (contact) {
        const conversation = await repositories.conversations.getActiveByContactId(contact.id);
        if (conversation) {
          const pendingReq = await repositories.requirements.findLatestPendingByConversationId(conversation.id);
          if (pendingReq) {
            updated = await repositories.requirements.linkFormResponse(pendingReq.referenceId, formResponseId);
          }
        }
      }
    }

    if (!updated) {
      console.warn('[Form Sync] Submission received without matching open requirement:', { referenceId, phone, formResponseId });
      res.status(200).json({
        message: 'Form response received, but no matching pending requirement was found for correlation',
        referenceId,
        formResponseId,
      });
      return;
    }

    console.log(`[Form Sync] Successfully linked Form Response ${formResponseId} to Ref ${updated.referenceId}`);

    // 1. Notify HOD directly on WhatsApp
    await notificationService.notifyFormSynced(updated.referenceId, {
      studentName: name,
      phone,
      query,
    });

    // 2. Notify Student on WhatsApp (if student phone is identifiable)
    if (phone) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      try {
        const studentConfirmMsg =
          `✅ *Form Submission Received*\n\n` +
          `Your official department form submission for Reference *${updated.referenceId}* has been received and linked.\n\n` +
          `Your request has been placed in the review queue for ${name ? name : 'you'}. You will receive status updates directly here on WhatsApp.`;

        await whatsappClient.send({
          to: cleanPhone,
          text: studentConfirmMsg,
        });
      } catch (err: any) {
        console.warn(`[Form Sync] Note: Could not send WhatsApp confirmation to student phone ${cleanPhone}:`, err.message);
      }
    }

    res.json({
      message: 'Form response synchronized successfully',
      requirement: updated,
    });
  } catch (err: any) {
    console.error('[Forms Sync Error]', err);
    res.status(500).json({ error: err.message });
  }
});
