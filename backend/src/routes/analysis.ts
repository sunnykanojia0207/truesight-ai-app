import { Router } from 'express';
import { getAnalysis } from '../controllers/analysisResultController.js';
import { validateObjectId } from '../middleware/validation.js';

const router = Router();

/**
 * GET /api/analysis/:analysisId
 * Get analysis result by ID
 */
router.get('/:analysisId', validateObjectId('analysisId'), getAnalysis);

export default router;
