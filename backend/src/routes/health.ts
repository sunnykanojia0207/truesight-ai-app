import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis.js';
import { checkAIEngineHealth, getCircuitBreakerStatus } from '../services/aiEngineClient.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check Redis connection
    const redisStatus = redisClient.isOpen ? 'connected' : 'disconnected';

    // Check AI Engine (with timeout)
    let aiEngineStatus = 'unknown';
    let aiEngineDetails = null;
    try {
      const aiHealth = await checkAIEngineHealth();
      aiEngineStatus = aiHealth.status === 'healthy' ? 'connected' : 'unhealthy';
      aiEngineDetails = aiHealth;
    } catch (error) {
      aiEngineStatus = 'disconnected';
    }

    // Get circuit breaker status
    const circuitBreaker = getCircuitBreakerStatus();

    const isHealthy = mongoStatus === 'connected' && redisStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        redis: redisStatus,
        aiEngine: aiEngineStatus,
      },
      aiEngine: aiEngineDetails,
      circuitBreaker: {
        state: circuitBreaker.state,
        failures: circuitBreaker.failures,
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

export default router;
