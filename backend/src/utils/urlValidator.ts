import { CustomError } from '../middleware/errorHandler.js';

/**
 * Validate URL format
 */
export const validateUrl = (url: string): URL => {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new CustomError(
        'Invalid URL protocol. Only HTTP and HTTPS are supported',
        400,
        'INVALID_URL',
        { protocol: parsedUrl.protocol }
      );
    }

    return parsedUrl;
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError(
      'Invalid URL format',
      400,
      'INVALID_URL',
      { url }
    );
  }
};

/**
 * Check if URL is a YouTube URL
 */
export const isYouTubeUrl = (url: URL): boolean => {
  const hostname = url.hostname.toLowerCase();
  return hostname.includes('youtube.com') || hostname.includes('youtu.be');
};

/**
 * Check if URL is an Instagram URL
 */
export const isInstagramUrl = (url: URL): boolean => {
  const hostname = url.hostname.toLowerCase();
  return hostname.includes('instagram.com');
};

/**
 * Extract YouTube video ID from URL
 */
export const extractYouTubeVideoId = (url: URL): string | null => {
  const hostname = url.hostname.toLowerCase();
  
  // youtu.be format
  if (hostname.includes('youtu.be')) {
    return url.pathname.slice(1).split('?')[0];
  }
  
  // youtube.com format
  if (hostname.includes('youtube.com')) {
    const searchParams = url.searchParams;
    return searchParams.get('v');
  }
  
  return null;
};

/**
 * Detect content type from URL
 */
export const detectContentTypeFromUrl = (url: string): 'image' | 'video' | 'unknown' => {
  const lowerUrl = url.toLowerCase();
  
  // Image extensions
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  if (imageExtensions.some(ext => lowerUrl.includes(ext))) {
    return 'image';
  }
  
  // Video extensions
  const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
  if (videoExtensions.some(ext => lowerUrl.includes(ext))) {
    return 'video';
  }
  
  // YouTube and Instagram are video platforms
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'video';
  }
  
  return 'unknown';
};
