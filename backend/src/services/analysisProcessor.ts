import { analyzeImage, analyzeVideo } from './aiEngineClient.js';
import { updateAnalysis, findAnalysisById } from './analysisService.js';
import { deleteFile } from '../utils/fileCleanup.js';
import logger from '../config/logger.js';

/**
 * Process image analysis asynchronously
 */
export const processImageAnalysis = async (analysisId: string, filePath: string): Promise<void> => {
  try {
    logger.info(`Starting image analysis: ${analysisId}`);

    // Call AI Engine
    const result = await analyzeImage(filePath);

    // Update analysis record with results
    await updateAnalysis(analysisId, {
      status: 'completed',
      result: {
        truthScore: result.truthScore,
        aiGeneratedProbability: result.aiGeneratedProbability,
        realProbability: result.realProbability,
        deepfakeDetection: result.deepfakeDetection,
        manipulationHeatmap: result.manipulationHeatmap,
        metadata: result.metadata,
        predictedSource: result.predictedSource,
        processingTime: result.processingTime,
      },
      completedAt: new Date(),
    });

    logger.info(`Image analysis completed: ${analysisId}`);
  } catch (error) {
    logger.error(`Image analysis failed: ${analysisId}`, error);

    // Update analysis record with error
    await updateAnalysis(analysisId, {
      status: 'failed',
      error: (error as Error).message,
      completedAt: new Date(),
    });
  } finally {
    // Clean up file after processing
    await deleteFile(filePath);
  }
};

/**
 * Process video analysis asynchronously
 */
export const processVideoAnalysis = async (analysisId: string, filePath: string): Promise<void> => {
  try {
    logger.info(`Starting video analysis: ${analysisId}`);

    // Call AI Engine
    const result = await analyzeVideo(filePath);

    // Update analysis record with results
    await updateAnalysis(analysisId, {
      status: 'completed',
      result: {
        truthScore: result.truthScore,
        aiGeneratedProbability: result.aiGeneratedProbability || 100 - result.truthScore,
        realProbability: result.truthScore,
        deepfakeDetection: result.deepfakeDetection,
        metadata: result.metadata,
        predictedSource: result.predictedSource || 'Unknown',
        processingTime: result.processingTime,
        videoTimeline: result.frameAnalyses,
      },
      completedAt: new Date(),
    });

    logger.info(`Video analysis completed: ${analysisId}`);
  } catch (error) {
    logger.error(`Video analysis failed: ${analysisId}`, error);

    // Update analysis record with error
    await updateAnalysis(analysisId, {
      status: 'failed',
      error: (error as Error).message,
      completedAt: new Date(),
    });
  } finally {
    // Clean up file after processing
    await deleteFile(filePath);
  }
};

/**
 * Start analysis processing (fire and forget)
 */
export const startAnalysis = (analysisId: string, filePath: string, contentType: 'image' | 'video'): void => {
  // Process asynchronously without blocking the response
  if (contentType === 'image') {
    processImageAnalysis(analysisId, filePath).catch((error) => {
      logger.error(`Unhandled error in image analysis: ${analysisId}`, error);
    });
  } else {
    processVideoAnalysis(analysisId, filePath).catch((error) => {
      logger.error(`Unhandled error in video analysis: ${analysisId}`, error);
    });
  }
};
