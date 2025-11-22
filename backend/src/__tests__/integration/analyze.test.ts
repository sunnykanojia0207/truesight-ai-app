import request from 'supertest';
import express from 'express';
import axios from 'axios';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/testDb.js';
import analyzeRouter from '../../routes/analyze.js';
import { errorHandler } from '../../middleware/errorHandler.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/analyze', analyzeRouter);
  app.use(errorHandler);
  return app;
};

describe('Analyze URL Endpoint', () => {
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
    jest.clearAllMocks();
  });

  describe('POST /api/analyze/url', () => {
    it('should accept valid image URL', async () => {
      // Mock successful image download
      mockedAxios.get.mockResolvedValueOnce({
        data: Buffer.from('fake image data'),
        headers: {
          'content-type': 'image/jpeg',
          'content-length': '1000',
        },
      });

      const response = await request(app)
        .post('/api/analyze/url')
        .send({
          url: 'https://example.com/image.jpg',
          type: 'image',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analysisId');
      expect(response.body.status).toBe('processing');
    });

    it('should accept valid YouTube URL', async () => {
      const response = await request(app)
        .post('/api/analyze/url')
        .send({
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          type: 'video',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analysisId');
    });

    it('should accept valid Instagram URL', async () => {
      const response = await request(app)
        .post('/api/analyze/url')
        .send({
          url: 'https://www.instagram.com/p/ABC123/',
          type: 'auto',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analysisId');
    });

    it('should reject invalid URL format', async () => {
      const response = await request(app)
        .post('/api/analyze/url')
        .send({
          url: 'not-a-valid-url',
          type: 'image',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toBe('INVALID_URL');
    });

    it('should reject missing URL', async () => {
      const response = await request(app)
        .post('/api/analyze/url')
        .send({
          type: 'image',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject inaccessible URL', async () => {
      // Mock failed download
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const response = await request(app)
        .post('/api/analyze/url')
        .send({
          url: 'https://example.com/nonexistent.jpg',
          type: 'image',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('URL_FETCH_FAILED');
    });

    it('should reject URL with unsupported content type', async () => {
      // Mock download with unsupported content type
      mockedAxios.get.mockResolvedValueOnce({
        data: Buffer.from('fake data'),
        headers: {
          'content-type': 'text/html',
          'content-length': '1000',
        },
      });

      const response = await request(app)
        .post('/api/analyze/url')
        .send({
          url: 'https://example.com/page.html',
          type: 'auto',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_CONTENT_TYPE');
    });

    it('should reject URL with content exceeding size limit', async () => {
      // Mock download with large content
      mockedAxios.get.mockResolvedValueOnce({
        data: Buffer.alloc(101 * 1024 * 1024),
        headers: {
          'content-type': 'video/mp4',
          'content-length': String(101 * 1024 * 1024),
        },
      });

      const response = await request(app)
        .post('/api/analyze/url')
        .send({
          url: 'https://example.com/large-video.mp4',
          type: 'video',
        })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });
  });
});
