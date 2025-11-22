import { Request, Response, NextFunction } from 'express';
import { findAnalysisById } from '../services/analysisService.js';
import { CustomError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

/**
 * Get analysis by ID
 */
export const getAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { analysisId } = req.params;

    if (!analysisId) {
      throw new CustomError('Analysis ID is required', 400, 'MISSING_ANALYSIS_ID');
    }

    logger.info(`Retrieving analysis: ${analysisId}`);

    const analysis = await findAnalysisById(analysisId);

    if (!analysis) {
      throw new CustomError(
        'Analysis not found',
        404,
        'NOT_FOUND',
        { analysisId }
      );
    }

    res.status(200).json({
      id: analysis._id,
      status: analysis.status,
      contentType: analysis.contentType,
      sourceType: analysis.sourceType,
      sourceUrl: analysis.sourceUrl,
      result: analysis.result,
      error: analysis.error,
      createdAt: analysis.createdAt,
      completedAt: analysis.completedAt,
    });

  } catch (error) {
    next(error);
  }
};
