import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import {
  validateUrl,
  isYouTubeUrl,
  isInstagramUrl,
  extractYouTubeVideoId,
  detectContentTypeFromUrl,
} from '../utils/urlValidator.js';
import {
  downloadFromUrl,
  downloadFromYouTube,
  downloadFromInstagram,
} from '../services/urlFetcher.js';
import { validateImageFile, validateVideoFile } from '../utils/fileValidation.js';
import { deleteFile } from '../utils/fileCleanup.js';
import { generateImageThumbnail, generateVideoThumbnail } from '../utils/thumbnailGenerator.js';
import { CustomError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

interface AnalyzeUrlRequest {
  url: string;
  type?: 'image' | 'video' | 'auto';
}

/**
 * Handle URL analysis request
 */
export const analyzeUrl = async (req: Request, res: Response, next: NextFunction) => {
  let filePath: string | undefined;

  try {
    const { url, type = 'auto' } = req.body as AnalyzeUrlRequest;

    if (!url) {
      throw new CustomError('URL is required', 400, 'MISSING_URL');
    }

    // Validate URL format
    const parsedUrl = validateUrl(url);
    logger.info(`URL analysis request: ${url} (type: ${type})`);

    let downloadResult;
    let contentType: 'image' | 'video';

    // Handle YouTube URLs
    if (isYouTubeUrl(parsedUrl)) {
      const videoId = extractYouTubeVideoId(parsedUrl);

      if (!videoId) {
        throw new CustomError(
          'Invalid YouTube URL - could not extract video ID',
          400,
          'INVALID_URL'
        );
      }

      logger.info(`Detected YouTube video: ${videoId}`);
      downloadResult = await downloadFromYouTube(videoId);
      contentType = 'video';
    }
    // Handle Instagram URLs
    else if (isInstagramUrl(parsedUrl)) {
      logger.info('Detected Instagram URL');
      downloadResult = await downloadFromInstagram(url);

      // Determine content type from downloaded file
      const detectedType = detectContentTypeFromUrl(downloadResult.filePath);
      contentType = detectedType === 'image' ? 'image' : 'video';
    }
    // Handle direct URLs
    else {
      // Auto-detect content type if not specified
      let expectedType = type;
      if (type === 'auto') {
        const detected = detectContentTypeFromUrl(url);
        expectedType = detected === 'unknown' ? 'auto' : detected;
      }

      downloadResult = await downloadFromUrl(url, expectedType);

      // Determine content type from response
      contentType = downloadResult.contentType.startsWith('image/') ? 'image' : 'video';
    }

    filePath = downloadResult.filePath;

    // Validate downloaded file
    const buffer = await fs.readFile(filePath);
    let mimeType: string;

    if (contentType === 'image') {
      mimeType = await validateImageFile(buffer, downloadResult.size);
    } else {
      const headerBuffer = buffer.slice(0, 4096);
      mimeType = await validateVideoFile(headerBuffer, downloadResult.size);
    }

    logger.info(`URL content validated successfully: ${mimeType}`);

    // Generate thumbnail
    const thumbnail = contentType === 'image'
      ? await generateImageThumbnail(filePath)
      : await generateVideoThumbnail(filePath);

    // Create analysis record in database
    const { createAnalysis } = await import('../services/analysisService.js');
    const analysis = await createAnalysis({
      contentType,
      sourceType: 'url',
      sourceUrl: url,
      filePath,
      thumbnail,
    });

    // Start async analysis processing
    const { startAnalysis } = await import('../services/analysisProcessor.js');
    startAnalysis(analysis._id.toString(), filePath, contentType);

    res.status(200).json({
      analysisId: analysis._id,
      status: analysis.status,
      contentType,
      source: {
        url,
        type: isYouTubeUrl(parsedUrl) ? 'youtube' : isInstagramUrl(parsedUrl) ? 'instagram' : 'direct',
      },
      file: {
        size: downloadResult.size,
        mimeType,
      },
    });

  } catch (error) {
    // Clean up downloaded file on error
    if (filePath) {
      await deleteFile(filePath);
    }
    next(error);
  }
};
