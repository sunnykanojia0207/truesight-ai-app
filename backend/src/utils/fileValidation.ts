import { fileTypeFromBuffer } from 'file-type';
import { CustomError } from '../middleware/errorHandler.js';

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

// File size limits in bytes
const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE_MB || '10') * 1024 * 1024;
const MAX_VIDEO_SIZE = parseInt(process.env.MAX_VIDEO_SIZE_MB || '100') * 1024 * 1024;

// Magic bytes for file type validation
const IMAGE_SIGNATURES: { [key: string]: number[][] } = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
};

const VIDEO_SIGNATURES: { [key: string]: number[][] } = {
  'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], // ftyp
  'video/quicktime': [[0x00, 0x00, 0x00]], // MOV
  'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]], // EBML
};

export interface FileValidationResult {
  isValid: boolean;
  mimeType?: string;
  error?: string;
}

/**
 * Validate file size
 */
export const validateFileSize = (size: number, type: 'image' | 'video'): void => {
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  const maxSizeMB = type === 'image' ? process.env.MAX_IMAGE_SIZE_MB || '10' : process.env.MAX_VIDEO_SIZE_MB || '100';

  if (size > maxSize) {
    throw new CustomError(
      `File size exceeds ${maxSizeMB}MB limit`,
      400,
      'FILE_TOO_LARGE',
      { maxSize: maxSizeMB, actualSize: Math.round(size / 1024 / 1024) }
    );
  }
};

/**
 * Validate file type using magic bytes
 */
export const validateFileSignature = async (
  buffer: Buffer,
  expectedType: 'image' | 'video'
): Promise<FileValidationResult> => {
  try {
    // Use file-type library for accurate detection
    const fileType = await fileTypeFromBuffer(buffer);

    if (!fileType) {
      return {
        isValid: false,
        error: 'Unable to determine file type',
      };
    }

    const allowedTypes = expectedType === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;

    if (!allowedTypes.includes(fileType.mime)) {
      return {
        isValid: false,
        error: `Invalid file type. Expected ${expectedType}, got ${fileType.mime}`,
      };
    }

    return {
      isValid: true,
      mimeType: fileType.mime,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'File validation failed',
    };
  }
};

/**
 * Validate image file
 */
export const validateImageFile = async (buffer: Buffer, size: number): Promise<string> => {
  // Validate size
  validateFileSize(size, 'image');

  // Validate file signature
  const validation = await validateFileSignature(buffer, 'image');

  if (!validation.isValid) {
    throw new CustomError(
      validation.error || 'Invalid image file',
      400,
      'INVALID_FILE_TYPE',
      { allowedTypes: ALLOWED_IMAGE_TYPES }
    );
  }

  return validation.mimeType!;
};

/**
 * Validate video file
 */
export const validateVideoFile = async (buffer: Buffer, size: number): Promise<string> => {
  // Validate size
  validateFileSize(size, 'video');

  // Validate file signature
  const validation = await validateFileSignature(buffer, 'video');

  if (!validation.isValid) {
    throw new CustomError(
      validation.error || 'Invalid video file',
      400,
      'INVALID_FILE_TYPE',
      { allowedTypes: ALLOWED_VIDEO_TYPES }
    );
  }

  return validation.mimeType!;
};

/**
 * Sanitize filename to prevent path traversal attacks
 */
export const sanitizeFilename = (filename: string): string => {
  // Remove path separators and special characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '_')
    .substring(0, 255);
};
