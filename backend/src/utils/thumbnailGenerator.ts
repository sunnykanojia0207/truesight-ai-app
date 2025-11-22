import sharp from 'sharp';
import fs from 'fs/promises';
import logger from '../config/logger.js';

const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;
const THUMBNAIL_QUALITY = 80;

/**
 * Generate a base64 thumbnail from an image file
 */
export const generateImageThumbnail = async (filePath: string): Promise<string> => {
  try {
    logger.debug(`Generating thumbnail for: ${filePath}`);

    // Read the image file
    const imageBuffer = await fs.readFile(filePath);

    // Generate thumbnail using sharp
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: THUMBNAIL_QUALITY })
      .toBuffer();

    // Convert to base64
    const base64Thumbnail = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;

    logger.debug('Thumbnail generated successfully');
    return base64Thumbnail;
  } catch (error) {
    logger.error('Error generating thumbnail:', error);
    // Return a placeholder thumbnail on error
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2NjYyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZTwvdGV4dD48L3N2Zz4=';
  }
};

/**
 * Generate a base64 thumbnail from a video file
 * For now, returns a placeholder. In production, use ffmpeg to extract a frame.
 */
export const generateVideoThumbnail = async (filePath: string): Promise<string> => {
  try {
    logger.debug(`Generating video thumbnail for: ${filePath}`);
    
    // TODO: Use ffmpeg to extract a frame from the video
    // For now, return a placeholder SVG
    const placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjxwb2x5Z29uIHBvaW50cz0iNzAsNTAgNzAsMTUwIDEzMCwxMDAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=';
    
    logger.debug('Video thumbnail placeholder generated');
    return placeholder;
  } catch (error) {
    logger.error('Error generating video thumbnail:', error);
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjxwb2x5Z29uIHBvaW50cz0iNzAsNTAgNzAsMTUwIDEzMCwxMDAiIGZpbGw9IiNmZmYiLz48L3N2Zz4=';
  }
};
