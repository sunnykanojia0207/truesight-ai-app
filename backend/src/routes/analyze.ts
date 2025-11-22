import { Router } from 'express';
import { analyzeUrl } from '../controllers/analyzeController.js';
import { urlAnalysisRateLimiter } from '../middleware/rateLimiter.js';
import { validateRequestBody } from '../middleware/validation.js';

const router = Router();

/**
 * POST /api/analyze/url
 * Analyze content from a URL
 */
router.post('/url', urlAnalysisRateLimiter, validateRequestBody, analyzeUrl);

export default router;
