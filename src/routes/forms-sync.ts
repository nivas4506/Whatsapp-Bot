import { Router, Request, Response } from 'express';
import { repositories } from '../store/repositories/index.js';

export const formsSyncRouter = Router();

/**
 * POST /internal/forms/responses/sync
 * Correlates an external Google Form submission with a student's requirement record
 */
formsSyncRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { referenceId, formResponseId } = req.body;

    if (!referenceId || !formResponseId) {
      res.status(400).json({ error: 'referenceId and formResponseId are required' });
      return;
    }

    const updated = await repositories.requirements.linkFormResponse(referenceId, formResponseId);
    if (!updated) {
      res.status(404).json({ error: `No requirement record found with reference ID: ${referenceId}` });
      return;
    }

    console.log(`[Form Sync] Linked Form Response ${formResponseId} to Ref ${referenceId}`);
    res.json({
      message: 'Form response synchronized successfully',
      requirement: updated,
    });
  } catch (err: any) {
    console.error('[Forms Sync Error]', err);
    res.status(500).json({ error: err.message });
  }
});
