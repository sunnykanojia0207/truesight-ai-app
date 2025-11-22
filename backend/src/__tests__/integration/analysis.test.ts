import request from 'supertest';
import express from 'express';
import { Types } from 'mongoose';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/testDb.js';
import { createMockAnalysis } from '../helpers/mockData.js';
import analysisRouter from '../../routes/analysis.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import Analysis from '../../models/Analysis.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/analysis', analysisRouter);
  app.use(errorHandler);
  return app;
};

describe('Analysis Endpoints', () => {
  let app: express.Application;

  beforeAll(async () => {
    await connectTestDb();
    app = createTestApp();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  describe('GET /api/analysis/:analysisId', () => {
    it('should retrieve completed analysis by ID', async () => {
      // Create test analysis
      const mockAnalysis = createMockAnalysis({
        status: 'completed',
      });
      const analysis = await Analysis.create(mockAnalysis);

      const response = await request(app)
        .get(`/api/analysis/${analysis._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('completed');
      expect(response.body).toHaveProperty('result');
      expect(response.body.result).toHaveProperty('truthScore');
    });

    it('should retrieve processing analysis by ID', async () => {
      // Create processing analysis
      const mockAnalysis = createMockAnalysis({
        status: 'processing',
        result: undefined,
        completedAt: undefined,
      });
      const analysis = await Analysis.create(mockAnalysis);

      const response = await request(app)
        .get(`/api/analysis/${analysis._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.status).toBe('processing');
      expect(response.body.result).toBeUndefined();
    });

    it('should retrieve failed analysis by ID', async () => {
      // Create failed analysis
      const mockAnalysis = createMockAnalysis({
        status: 'failed',
        result: undefined,
        error: 'Analysis failed due to invalid content',
      });
      const analysis = await Analysis.create(mockAnalysis);

      const response = await request(app)
        .get(`/api/analysis/${analysis._id}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.status).toBe('failed');
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Analysis failed due to invalid content');
    });

    it('should return 404 for non-existent analysis ID', async () => {
      const fakeId = new Types.ObjectId();

      const response = await request(app)
        .get(`/api/analysis/${fakeId}`)
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toBe('ANALYSIS_NOT_FOUND');
    });

    it('should return 400 for invalid analysis ID format', async () => {
      const response = await request(app)
        .get('/api/analysis/invalid-id')
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.error).toHaveProperty('code');
    });
  });

  describe('Analysis data structure', () => {
    it('should include all required fields in completed analysis', async () => {
      const mockAnalysis = createMockAnalysis({
        status: 'completed',
      });
      const analysis = await Analysis.create(mockAnalysis);

      const response = await request(app)
        .get(`/api/analysis/${analysis._id}`)
        .expect(200);

      // Check top-level fields
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('contentType');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('completedAt');

      // Check result structure
      const result = response.body.result;
      expect(result).toHaveProperty('truthScore');
      expect(result).toHaveProperty('aiGeneratedProbability');
      expect(result).toHaveProperty('realProbability');
      expect(result).toHaveProperty('deepfakeDetection');
      expect(result).toHaveProperty('metadata');
      expect(result).toHaveProperty('predictedSource');
      expect(result).toHaveProperty('processingTime');

      // Check deepfake detection structure
      expect(result.deepfakeDetection).toHaveProperty('facesDetected');
      expect(result.deepfakeDetection).toHaveProperty('deepfakeFaces');

      // Check metadata structure
      expect(result.metadata).toHaveProperty('compressionScore');
      expect(result.metadata).toHaveProperty('ganFingerprint');
    });

    it('should include video timeline for video analysis', async () => {
      const mockAnalysis = createMockAnalysis({
        contentType: 'video',
        status: 'completed',
        result: {
          ...createMockAnalysis().result,
          videoTimeline: [
            { frameNumber: 0, timestamp: 0, truthScore: 75 },
            { frameNumber: 30, timestamp: 1, truthScore: 72 },
            { frameNumber: 60, timestamp: 2, truthScore: 78 },
          ],
        },
      });
      const analysis = await Analysis.create(mockAnalysis);

      const response = await request(app)
        .get(`/api/analysis/${analysis._id}`)
        .expect(200);

      expect(response.body.result).toHaveProperty('videoTimeline');
      expect(Array.isArray(response.body.result.videoTimeline)).toBe(true);
      expect(response.body.result.videoTimeline.length).toBeGreaterThan(0);
    });
  });
});
