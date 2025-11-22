import axios, { AxiosResponse } from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CustomError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE_MB || '10') * 1024 * 1024;
const MAX_VIDEO_SIZE = parseInt(process.env.MAX_VIDEO_SIZE_MB || '100') * 1024 * 1024;
const DOWNLOAD_TIMEOUT = 60000; // 60 seconds

interface DownloadResult {
  filePath: string;
  contentType: string;
  size: number;
}

/**
 * Download content from direct URL
 */
export const downloadFromUrl = async (
  url: string,
  expectedType: 'image' | 'video' | 'auto'
): Promise<DownloadResult> => {
  try {
    logger.info(`Downloading content from URL: ${url}`);

    const response: AxiosResponse = await axios({
      method: 'GET',
      url,
      responseType: 'arraybuffer',
      timeout: DOWNLOAD_TIMEOUT,
      maxContentLength: MAX_VIDEO_SIZE,
      maxBodyLength: MAX_VIDEO_SIZE,
      headers: {
        'User-Agent': 'TrueSight-AI/1.0',
      },
    });

    const contentType = response.headers['content-type'] || '';
    const contentLength = parseInt(response.headers['content-length'] || '0');

    // Validate content type
    const isImage = contentType.startsWith('image/');
    const isVideo = contentType.startsWith('video/');

    if (expectedType === 'image' && !isImage) {
      throw new CustomError(
        'URL does not point to an image',
        400,
        'INVALID_URL',
        { contentType }
      );
    }

    if (expectedType === 'video' && !isVideo) {
      throw new CustomError(
        'URL does not point to a video',
        400,
        'INVALID_URL',
        { contentType }
      );
    }

    if (expectedType === 'auto' && !isImage && !isVideo) {
      throw new CustomError(
        'URL does not point to an image or video',
        400,
        'INVALID_URL',
        { contentType }
      );
    }

    // Validate size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (contentLength > maxSize) {
      throw new CustomError(
        `Content size exceeds maximum limit`,
        400,
        'FILE_TOO_LARGE',
        { size: contentLength, maxSize }
      );
    }

    // Save to file
    const ext = isImage ? '.jpg' : '.mp4';
    const filename = `${uuidv4()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    await fs.writeFile(filePath, response.data);

    logger.info(`Downloaded content saved to: ${filePath} (${contentLength} bytes)`);

    return {
      filePath,
      contentType,
      size: contentLength,
    };
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new CustomError(
          'Download timeout - content took too long to download',
          408,
          'DOWNLOAD_TIMEOUT'
        );
      }

      if (error.response?.status === 404) {
        throw new CustomError(
          'Content not found at the provided URL',
          404,
          'INVALID_URL'
        );
      }

      if (error.response?.status === 403) {
        throw new CustomError(
          'Access denied - unable to download content from URL',
          403,
          'INVALID_URL'
        );
      }
    }

    logger.error('Error downloading from URL:', error);
    throw new CustomError(
      'Failed to download content from URL',
      500,
      'DOWNLOAD_FAILED',
      { error: (error as Error).message }
    );
  }
};

/**
 * Extract video from YouTube URL
 * Note: This is a placeholder. In production, you'd use yt-dlp or similar
 */
export const downloadFromYouTube = async (videoId: string): Promise<DownloadResult> => {
  // TODO: Implement YouTube video extraction using yt-dlp or similar
  // For now, throw an error indicating this feature is not yet implemented
  throw new CustomError(
    'YouTube video extraction is not yet implemented',
    501,
    'NOT_IMPLEMENTED',
    { feature: 'youtube-download', videoId }
  );
};

/**
 * Extract media from Instagram URL
 * Note: This is a placeholder. In production, you'd use Instagram API or scraping
 */
export const downloadFromInstagram = async (url: string): Promise<DownloadResult> => {
  // TODO: Implement Instagram media extraction
  // For now, throw an error indicating this feature is not yet implemented
  throw new CustomError(
    'Instagram media extraction is not yet implemented',
    501,
    'NOT_IMPLEMENTED',
    { feature: 'instagram-download', url }
  );
};
