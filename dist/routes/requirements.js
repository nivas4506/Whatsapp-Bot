import { Router } from 'express';
import { repositories } from '../store/repositories/index.js';
export const requirementsRouter = Router();
/**
 * GET /internal/requirements
 * List submitted student requirements with status and category filtering
 */
requirementsRouter.get('/', async (req, res) => {
    try {
        const status = req.query.status;
        const category = req.query.category;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0;
        const items = await repositories.requirements.list({ status, category, limit, offset });
        res.json({ count: items.length, requirements: items });
    }
    catch (err) {
        console.error('[Requirements API Error]', err);
        res.status(500).json({ error: 'Failed to retrieve requirements' });
    }
});
/**
 * GET /internal/requirements/:referenceId
 * Lookup single requirement by reference ID
 */
requirementsRouter.get('/:referenceId', async (req, res) => {
    try {
        const referenceId = Array.isArray(req.params.referenceId) ? req.params.referenceId[0] : req.params.referenceId;
        const item = await repositories.requirements.findByReferenceId(referenceId);
        if (!item) {
            res.status(404).json({ error: 'Requirement not found' });
            return;
        }
        res.json(item);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
/**
 * PATCH /internal/requirements/:id
 * Update status (UNDER_REVIEW, RESOLVED, CLOSED, etc.) or assign staff reviewer
 */
requirementsRouter.patch('/:id', async (req, res) => {
    try {
        const { status, reviewer } = req.body;
        if (!status) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }
        const reqId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const updated = await repositories.requirements.updateStatus(reqId, status, reviewer);
        if (!updated) {
            res.status(404).json({ error: 'Requirement not found' });
            return;
        }
        res.json({ message: 'Requirement updated successfully', requirement: updated });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
