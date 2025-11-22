import request from 'supertest';
import express from 'express';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/testDb.js';
import uploadRouter from '../../routes/upload.js';
import analyzeRouter from '../../routes/analyze.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { uploadRateLimiter, urlAnalysisRateLimiter } from '../../middleware/rateLimiter.js';

// Create test app with rate limiting
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/upload', uploadRouter);
  app.use('/api/analyze', analyzeRouter);
  app.use(errorHandler);
  return app;
};

describe('Rate Limiting', () => {
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
    // Wait for rate limit window to reset
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  describe('Upload Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
      ]);

      // Make 3 requests (should all succeed)
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/upload/image')
          .attach('file', jpegBuffer, 'test.jpg');

        expect(response.status).toBe(200);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
      ]);

      // Make requests up to the limit
      const limit = 5; // Adjust based on your rate limit config
      const requests = [];

      for (let i = 0; i < limit + 2; i++) {
        requests.push(
          request(app)
            .post('/api/upload/image')
            .attach('file', jpegBuffer, 'test.jpg')
        );
      }

      const responses = await Promise.all(requests);

      // Check that some requests were rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should include rate limit headers', async () => {
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
      ]);

      const response = await request(app)
        .post('/api/upload/image')
        .attach('file', jpegBuffer, 'test.jpg');

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('URL Analysis Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Make 3 requests (should all succeed)
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/analyze/url')
          .send({
            url: 'https://example.com/image.jpg',
            type: 'image',
          });

        expect([200, 400]).toContain(response.status); // May fail validation but not rate limit
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const limit = 5; // Adjust based on your rate limit config
      const requests = [];

      for (let i = 0; i < limit + 2; i++) {
        requests.push(
          request(app)
            .post('/api/analyze/url')
            .send({
              url: 'https://example.com/image.jpg',
              type: 'image',
            })
        );
      }

      const responses = await Promise.all(requests);

      // Check that some requests were rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Rate Limit Reset', () => {
    it('should reset rate limit after window expires', async () => {
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
      ]);

      // Make initial request
      const response1 = await request(app)
        .post('/api/upload/image')
        .attach('file', jpegBuffer, 'test.jpg');

      expect(response1.status).toBe(200);

      // Wait for rate limit window to reset (adjust based on config)
      await new Promise(resolve => setTimeout(resolve, 61000)); // 61 seconds

      // Make another request (should succeed)
      const response2 = await request(app)
        .post('/api/upload/image')
        .attach('file', jpegBuffer, 'test.jpg');

      expect(response2.status).toBe(200);
    }, 70000); // Increase test timeout
  });
});
