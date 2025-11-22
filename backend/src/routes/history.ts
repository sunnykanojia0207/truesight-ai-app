import { Router } from 'express';
import { getHistory } from '../controllers/historyController.js';
import { validatePagination, sanitizeQueryParams } from '../middleware/validation.js';

const router = Router();

/**
 * GET /api/history
 * Get analysis history with pagination
 */
router.get('/', sanitizeQueryParams, validatePagination, getHistory);

export default router;
