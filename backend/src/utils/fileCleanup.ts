import fs from 'fs/promises';
import path from 'path';
import logger from '../config/logger.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const CLEANUP_INTERVAL = parseInt(process.env.FILE_CLEANUP_INTERVAL_MS || '3600000'); // 1 hour default
const FILE_MAX_AGE = 3600000; // 1 hour in milliseconds

/**
 * Delete a single file
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
    logger.info(`Deleted file: ${filePath}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.error(`Failed to delete file ${filePath}:`, error);
    }
  }
};

/**
 * Clean up old files in upload directory
 */
export const cleanupOldFiles = async (): Promise<void> => {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const now = Date.now();
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, file);
      
      try {
        const stats = await fs.stat(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > FILE_MAX_AGE) {
          await deleteFile(filePath);
          deletedCount++;
        }
      } catch (error) {
        logger.error(`Error processing file ${filePath}:`, error);
      }
    }

    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} old files from ${UPLOAD_DIR}`);
    }
  } catch (error) {
    logger.error('Error during file cleanup:', error);
  }
};

/**
 * Start automatic file cleanup interval
 */
export const startFileCleanup = (): NodeJS.Timeout => {
  logger.info(`Starting file cleanup service (interval: ${CLEANUP_INTERVAL}ms)`);
  
  // Run cleanup immediately
  cleanupOldFiles();
  
  // Schedule periodic cleanup
  return setInterval(cleanupOldFiles, CLEANUP_INTERVAL);
};

/**
 * Ensure upload directory exists
 */
export const ensureUploadDir = async (): Promise<void> => {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    logger.info(`Upload directory ready: ${UPLOAD_DIR}`);
  } catch (error) {
    logger.error('Failed to create upload directory:', error);
    throw error;
  }
};
