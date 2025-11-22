import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDatabase } from './config/database.js';
import { connectRedis } from './config/redis.js';
import logger from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { addRequestId } from './middleware/requestId.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { sanitizeQueryParams } from './middleware/validation.js';
import { ensureUploadDir, startFileCleanup } from './utils/fileCleanup.js';
import healthRouter from './routes/health.js';
import uploadRouter from './routes/upload.js';
import analyzeRouter from './routes/analyze.js';
import analysisRouter from './routes/analysis.js';
import historyRouter from './routes/history.js';



const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware
app.use(addRequestId);

// Request logging middleware
app.use(requestLogger);

// Global rate limiting
app.use(apiRateLimiter);

// Query parameter sanitization
app.use(sanitizeQueryParams);

// Routes
app.use('/api', healthRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/history', historyRouter);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);



// Initialize connections and start server
const startServer = async () => {
  try {
    // Ensure upload directory exists
    await ensureUploadDir();

    // Connect to databases
    await connectDatabase();

    // Skip Redis for now (using memory-based rate limiting)
    logger.info('Skipping Redis connection - using memory-based rate limiting');

    // Start file cleanup service
    const cleanupInterval = startFileCleanup();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Backend Gateway running on port ${PORT}`);
      logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
    });

    // Handle shutdown signals
    const shutdown = async () => {
      logger.info('Received shutdown signal, closing server gracefully...');

      // Clear cleanup interval
      clearInterval(cleanupInterval);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          const { disconnectDatabase } = await import('./config/database.js');
          const { disconnectRedis } = await import('./config/redis.js');

          await disconnectDatabase();
          await disconnectRedis();

          logger.info('All connections closed, exiting process');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
const server = await startServer();

export default app;
