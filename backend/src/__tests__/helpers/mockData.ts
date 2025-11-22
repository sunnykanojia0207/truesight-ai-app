import { Types } from 'mongoose';

/**
 * Mock analysis result data for testing
 */
export const mockAnalysisResult = {
  truthScore: 75.5,
  aiGeneratedProbability: 24.5,
  realProbability: 75.5,
  deepfakeDetection: {
    facesDetected: 1,
    deepfakeFaces: [
      {
        boundingBox: [100, 100, 200, 200],
        confidence: 0.15,
      },
    ],
  },
  manipulationHeatmap: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  metadata: {
    exif: {
      Make: 'Canon',
      Model: 'EOS 5D',
    },
    compressionScore: 85,
    ganFingerprint: {
      detected: false,
      confidence: 0.1,
    },
  },
  predictedSource: 'Unknown',
  processingTime: 2.5,
};

/**
 * Create mock analysis document
 */
export const createMockAnalysis = (overrides = {}) => ({
  _id: new Types.ObjectId(),
  contentType: 'image',
  sourceType: 'upload',
  filePath: '/tmp/test-image.jpg',
  thumbnail: 'data:image/jpeg;base64,test',
  status: 'completed',
  result: mockAnalysisResult,
  createdAt: new Date(),
  completedAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  ...overrides,
});

/**
 * Mock AI Engine response
 */
export const mockAIEngineResponse = {
  truth_score: 75.5,
  ai_generated_probability: 24.5,
  real_probability: 75.5,
  deepfake_detection: {
    faces_detected: 1,
    deepfake_faces: [
      {
        bounding_box: [100, 100, 200, 200],
        confidence: 0.15,
      },
    ],
  },
  manipulation_heatmap: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  metadata: {
    exif: {
      Make: 'Canon',
      Model: 'EOS 5D',
    },
    compression_score: 85,
    gan_fingerprint: {
      detected: false,
      confidence: 0.1,
    },
  },
  predicted_source: 'Unknown',
  processing_time: 2.5,
};
