import { Analysis, IAnalysis } from '../models/Analysis.js';
import { CustomError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

// Default TTL: 30 days
const DEFAULT_TTL_DAYS = 30;

interface CreateAnalysisParams {
  userId?: string;
  contentType: 'image' | 'video';
  sourceType: 'upload' | 'url' | 'screenshot';
  sourceUrl?: string;
  filePath: string;
  thumbnail: string;
}

interface UpdateAnalysisParams {
  status?: 'processing' | 'completed' | 'failed';
  result?: IAnalysis['result'];
  error?: string;
  completedAt?: Date;
}

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginatedResult {
  analyses: IAnalysis[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Create a new analysis record
 */
export const createAnalysis = async (params: CreateAnalysisParams): Promise<IAnalysis> => {
  try {
    // Calculate expiration date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + DEFAULT_TTL_DAYS);

    const analysis = new Analysis({
      ...params,
      status: 'processing',
      expiresAt,
    });

    await analysis.save();
    
    logger.info(`Created analysis record: ${analysis._id}`);
    return analysis;
  } catch (error) {
    logger.error('Error creating analysis:', error);
    throw new CustomError(
      'Failed to create analysis record',
      500,
      'DATABASE_ERROR',
      { error: (error as Error).message }
    );
  }
};

/**
 * Find analysis by ID
 */
export const findAnalysisById = async (id: string): Promise<IAnalysis | null> => {
  try {
    const analysis = await Analysis.findById(id);
    return analysis;
  } catch (error) {
    logger.error(`Error finding analysis ${id}:`, error);
    throw new CustomError(
      'Failed to retrieve analysis',
      500,
      'DATABASE_ERROR',
      { error: (error as Error).message }
    );
  }
};

/**
 * Update analysis record
 */
export const updateAnalysis = async (
  id: string,
  updates: UpdateAnalysisParams
): Promise<IAnalysis | null> => {
  try {
    const analysis = await Analysis.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!analysis) {
      throw new CustomError(
        'Analysis not found',
        404,
        'NOT_FOUND',
        { analysisId: id }
      );
    }

    logger.info(`Updated analysis record: ${id}`);
    return analysis;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error(`Error updating analysis ${id}:`, error);
    throw new CustomError(
      'Failed to update analysis',
      500,
      'DATABASE_ERROR',
      { error: (error as Error).message }
    );
  }
};

/**
 * Find analyses by user ID with pagination
 */
export const findAnalysesByUserId = async (
  userId: string,
  params: PaginationParams = {}
): Promise<PaginatedResult> => {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Analysis.countDocuments({ userId });

    // Get paginated results
    const analyses = await Analysis.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id contentType thumbnail status result.truthScore createdAt sourceType')
      .lean();

    const totalPages = Math.ceil(total / limit);

    return {
      analyses: analyses as IAnalysis[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    logger.error(`Error finding analyses for user ${userId}:`, error);
    throw new CustomError(
      'Failed to retrieve analyses',
      500,
      'DATABASE_ERROR',
      { error: (error as Error).message }
    );
  }
};

/**
 * Find all analyses with pagination (for anonymous users or admin)
 */
export const findAllAnalyses = async (
  params: PaginationParams = {}
): Promise<PaginatedResult> => {
  try {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Analysis.countDocuments();

    // Get paginated results
    const analyses = await Analysis.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id contentType thumbnail status result.truthScore createdAt sourceType')
      .lean();

    const totalPages = Math.ceil(total / limit);

    return {
      analyses: analyses as IAnalysis[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    logger.error('Error finding all analyses:', error);
    throw new CustomError(
      'Failed to retrieve analyses',
      500,
      'DATABASE_ERROR',
      { error: (error as Error).message }
    );
  }
};

/**
 * Delete analysis by ID
 */
export const deleteAnalysis = async (id: string): Promise<void> => {
  try {
    const result = await Analysis.findByIdAndDelete(id);
    
    if (!result) {
      throw new CustomError(
        'Analysis not found',
        404,
        'NOT_FOUND',
        { analysisId: id }
      );
    }

    logger.info(`Deleted analysis record: ${id}`);
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    logger.error(`Error deleting analysis ${id}:`, error);
    throw new CustomError(
      'Failed to delete analysis',
      500,
      'DATABASE_ERROR',
      { error: (error as Error).message }
    );
  }
};

/**
 * Get analysis statistics
 */
export const getAnalysisStats = async (userId?: string) => {
  try {
    const query = userId ? { userId } : {};

    const stats = await Analysis.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Analysis.countDocuments(query);

    return {
      total,
      byStatus: stats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    logger.error('Error getting analysis stats:', error);
    throw new CustomError(
      'Failed to retrieve statistics',
      500,
      'DATABASE_ERROR',
      { error: (error as Error).message }
    );
  }
};
