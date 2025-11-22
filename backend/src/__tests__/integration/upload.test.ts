import request from 'supertest';
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/testDb.js';
import uploadRouter from '../../routes/upload.js';
import { errorHandler } from '../../middleware/errorHandler.js';

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/upload', uploadRouter);
  app.use(errorHandler);
  return app;
};

describe('Upload Endpoints', () => {
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

  describe('POST /api/upload/image', () => {
    it('should accept valid JPEG image', async () => {
      // Create a minimal valid JPEG buffer
      const jpegBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
        0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
        0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
      ]);

      const response = await request(app)
        .post('/api/upload/image')
        .attach('file', jpegBuffer, 'test.jpg')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analysisId');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('processing');
    });

    it('should accept valid PNG image', async () => {
      // Create a minimal valid PNG buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
        0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
        0x42, 0x60, 0x82
      ]);

      const response = await request(app)
        .post('/api/upload/image')
        .attach('file', pngBuffer, 'test.png')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analysisId');
    });

    it('should reject file without extension', async () => {
      const buffer = Buffer.from('test data');

      const response = await request(app)
        .post('/api/upload/image')
        .attach('file', buffer, 'test')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject unsupported file type', async () => {
      const buffer = Buffer.from('test data');

      const response = await request(app)
        .post('/api/upload/image')
        .attach('file', buffer, 'test.txt')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('should reject file exceeding size limit', async () => {
      // Create a buffer larger than 10MB
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

      const response = await request(app)
        .post('/api/upload/image')
        .attach('file', largeBuffer, 'large.jpg')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });

    it('should reject request without file', async () => {
      const response = await request(app)
        .post('/api/upload/image')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/upload/video', () => {
    it('should accept valid video file', async () => {
      // Create a minimal valid MP4 buffer (ftyp box)
      const mp4Buffer = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
        0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
        0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
        0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31
      ]);

      const response = await request(app)
        .post('/api/upload/video')
        .attach('file', mp4Buffer, 'test.mp4')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analysisId');
      expect(response.body.status).toBe('processing');
    });

    it('should reject unsupported video format', async () => {
      const buffer = Buffer.from('test data');

      const response = await request(app)
        .post('/api/upload/video')
        .attach('file', buffer, 'test.avi')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_FILE_TYPE');
    });

    it('should reject video exceeding size limit', async () => {
      // Create a buffer larger than 100MB
      const largeBuffer = Buffer.alloc(101 * 1024 * 1024);

      const response = await request(app)
        .post('/api/upload/video')
        .attach('file', largeBuffer, 'large.mp4')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });
  });
});
