/**
 * API service for backend communication
 */
import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add request ID for tracking
    config.headers['x-request-id'] = crypto.randomUUID();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle errors globally
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// Export types
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId?: string;
}

export interface AnalysisResponse {
  analysisId: string;
  status: 'processing' | 'completed' | 'failed';
  estimatedTime?: number;
}

export interface AnalysisResult {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  contentType?: 'image' | 'video';
  mediaUrl?: string;
  result?: {
    truthScore: number;
    aiGeneratedProbability: number;
    realProbability: number;
    deepfakeDetection: {
      facesDetected: number;
      deepfakeFaces: Array<{
        boundingBox: [number, number, number, number];
        confidence: number;
      }>;
    };
    manipulationHeatmap?: string;
    metadata: {
      exif?: Record<string, any>;
      compressionScore: number;
      ganFingerprint: {
        detected: boolean;
        confidence: number;
      };
    };
    timeline?: Array<{
      timestamp: number;
      frame_index: number;
      truth_score: number;
      is_manipulated: boolean;
    }>;
    predictedSource: string;
    processingTime: number;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface HistoryItem {
  id: string;
  thumbnailUrl?: string;
  contentType: 'image' | 'video';
  status: 'processing' | 'completed' | 'failed';
  truthScore?: number;
  createdAt: string;
}

export interface HistoryResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
