/**
 * API configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  health: '/health',
  uploadImage: '/upload/image',
  uploadVideo: '/upload/video',
  analyzeUrl: '/analyze/url',
  getAnalysis: (id: string) => `/analysis/${id}`,
  getHistory: '/history',
} as const;
