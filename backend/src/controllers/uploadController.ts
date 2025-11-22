import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import { validateImageFile, validateVideoFile } from '../utils/fileValidation.js';
import { deleteFile } from '../utils/fileCleanup.js';
import { CustomError } from '../middleware/errorHandler.js';
import { generateImageThumbnail, generateVideoThumbnail } from '../utils/thumbnailGenerator.js';
import logger from '../config/logger.js';

/**
 * Handle image upload
 */
export const uploadImage = async (req: Request, res: Response, next: NextFunction) => {
  let filePath: string | undefined;

  try {
    if (!req.file) {
      throw new CustomError('No file uploaded', 400, 'NO_FILE_UPLOADED');
    }

    filePath = req.file.path;
    logger.info(`Image upload received: ${req.file.originalname} (${req.file.size} bytes)`);

    // Read file buffer for validation
    const buffer = await fs.readFile(filePath);

    // Validate image file with magic bytes
    const mimeType = await validateImageFile(buffer, req.file.size);

    logger.info(`Image validated successfully: ${mimeType}`);

    // Generate thumbnail
    const thumbnail = await generateImageThumbnail(filePath);

    // Create analysis record in database
    const { createAnalysis } = await import('../services/analysisService.js');
    const analysis = await createAnalysis({
      contentType: 'image',
      sourceType: 'upload',
      filePath,
      thumbnail,
    });

    // Start async analysis processing
    const { startAnalysis } = await import('../services/analysisProcessor.js');
    startAnalysis(analysis._id.toString(), filePath, 'image');

    res.status(200).json({
      analysisId: analysis._id,
      status: analysis.status,
      estimatedTime: 30,
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType,
      },
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (filePath) {
      await deleteFile(filePath);
    }
    next(error);
  }
};

/**
 * Handle video upload
 */
export const uploadVideo = async (req: Request, res: Response, next: NextFunction) => {
  let filePath: string | undefined;

  try {
    if (!req.file) {
      throw new CustomError('No file uploaded', 400, 'NO_FILE_UPLOADED');
    }

    filePath = req.file.path;
    logger.info(`Video upload received: ${req.file.originalname} (${req.file.size} bytes)`);

    // Read file buffer for validation (first 4KB is enough for magic bytes)
    const buffer = await fs.readFile(filePath);
    const headerBuffer = buffer.slice(0, 4096);

    // Validate video file with magic bytes
    const mimeType = await validateVideoFile(headerBuffer, req.file.size);

    logger.info(`Video validated successfully: ${mimeType}`);

    // Generate thumbnail
    const thumbnail = await generateVideoThumbnail(filePath);

    // Create analysis record in database
    const { createAnalysis } = await import('../services/analysisService.js');
    const analysis = await createAnalysis({
      contentType: 'video',
      sourceType: 'upload',
      filePath,
      thumbnail,
    });

    // Start async analysis processing
    const { startAnalysis } = await import('../services/analysisProcessor.js');
    startAnalysis(analysis._id.toString(), filePath, 'video');

    res.status(200).json({
      analysisId: analysis._id,
      status: analysis.status,
      estimatedTime: 120,
      file: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType,
      },
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (filePath) {
      await deleteFile(filePath);
    }
    next(error);
  }
};
