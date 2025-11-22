import { Request, Response, NextFunction } from 'express';
import { findAllAnalyses, findAnalysesByUserId } from '../services/analysisService.js';
import logger from '../config/logger.js';

/**
 * Get analysis history with pagination
 */
export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.query.userId as string | undefined;

    logger.info(`Retrieving history: page=${page}, limit=${limit}, userId=${userId || 'all'}`);

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      res.status(400).json({
        error: {
          code: 'INVALID_PAGINATION',
          message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100',
        },
      });
      return;
    }

    // Get analyses
    const result = userId
      ? await findAnalysesByUserId(userId, { page, limit })
      : await findAllAnalyses({ page, limit });

    // Format response
    const analyses = result.analyses.map((analysis) => ({
      id: analysis._id,
      thumbnail: analysis.thumbnail,
      truthScore: analysis.result?.truthScore,
      createdAt: analysis.createdAt,
      contentType: analysis.contentType,
      sourceType: analysis.sourceType,
      status: analysis.status,
    }));

    res.status(200).json({
      analyses,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    });

  } catch (error) {
    next(error);
  }
};
