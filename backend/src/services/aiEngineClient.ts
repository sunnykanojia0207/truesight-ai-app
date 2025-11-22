import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { CustomError } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
const AI_ENGINE_API_KEY = process.env.AI_ENGINE_API_KEY || '';
const AI_ENGINE_TIMEOUT = 120000; // 2 minutes

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  state: 'CLOSED',
};

const CIRCUIT_BREAKER_THRESHOLD = 5; // Open circuit after 5 failures
const CIRCUIT_BREAKER_TIMEOUT = 60000; // Try again after 1 minute
const CIRCUIT_BREAKER_RESET_TIMEOUT = 30000; // Reset after 30 seconds of success

/**
 * Create axios instance for AI Engine communication
 */
const createAIEngineClient = (): AxiosInstance => {
  return axios.create({
    baseURL: AI_ENGINE_URL,
    timeout: AI_ENGINE_TIMEOUT,
    headers: {
      'X-API-Key': AI_ENGINE_API_KEY,
    },
  });
};

const aiEngineClient = createAIEngineClient();

/**
 * Check circuit breaker state
 */
const checkCircuitBreaker = (): void => {
  const now = Date.now();

  if (circuitBreaker.state === 'OPEN') {
    if (now - circuitBreaker.lastFailureTime > CIRCUIT_BREAKER_TIMEOUT) {
      logger.info('Circuit breaker transitioning to HALF_OPEN');
      circuitBreaker.state = 'HALF_OPEN';
    } else {
      throw new CustomError(
        'AI Engine is temporarily unavailable. Please try again later.',
        503,
        'AI_ENGINE_UNAVAILABLE',
        { retryAfter: Math.ceil((CIRCUIT_BREAKER_TIMEOUT - (now - circuitBreaker.lastFailureTime)) / 1000) }
      );
    }
  }
};

/**
 * Record circuit breaker failure
 */
const recordFailure = (): void => {
  circuitBreaker.failures++;
  circuitBreaker.lastFailureTime = Date.now();

  if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    logger.error(`Circuit breaker OPEN after ${circuitBreaker.failures} failures`);
    circuitBreaker.state = 'OPEN';
  }
};

/**
 * Record circuit breaker success
 */
const recordSuccess = (): void => {
  if (circuitBreaker.state === 'HALF_OPEN') {
    logger.info('Circuit breaker CLOSED after successful request');
    circuitBreaker.state = 'CLOSED';
    circuitBreaker.failures = 0;
  } else if (circuitBreaker.state === 'CLOSED') {
    // Reset failure count after period of success
    const now = Date.now();
    if (now - circuitBreaker.lastFailureTime > CIRCUIT_BREAKER_RESET_TIMEOUT) {
      circuitBreaker.failures = 0;
    }
  }
};

/**
 * Map AI Engine errors to backend error codes
 */
const mapAIEngineError = (error: AxiosError): CustomError => {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new CustomError(
      'AI analysis timeout. The content may be too large or complex.',
      408,
      'ANALYSIS_TIMEOUT'
    );
  }

  if (error.code === 'ECONNREFUSED') {
    return new CustomError(
      'AI Engine is unavailable',
      503,
      'AI_ENGINE_UNAVAILABLE'
    );
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data as any;

    if (status === 400) {
      return new CustomError(
        data?.message || 'Invalid content for analysis',
        400,
        'INVALID_CONTENT',
        data
      );
    }

    if (status === 413) {
      return new CustomError(
        'Content too large for analysis',
        413,
        'CONTENT_TOO_LARGE'
      );
    }

    if (status === 500) {
      return new CustomError(
        'AI analysis failed',
        500,
        'ANALYSIS_FAILED',
        { details: data?.message }
      );
    }
  }

  return new CustomError(
    'Failed to communicate with AI Engine',
    500,
    'AI_ENGINE_ERROR',
    { error: error.message }
  );
};

/**
 * Analyze image using AI Engine
 */
export const analyzeImage = async (filePath: string): Promise<any> => {
  try {
    checkCircuitBreaker();

    logger.info(`Sending image to AI Engine: ${filePath}`);

    // Create form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(filePath));

    // Send request with retry logic
    const response = await aiEngineClient.post('/analyze/image', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    recordSuccess();
    logger.info('Image analysis completed successfully');

    return response.data;
  } catch (error) {
    recordFailure();

    if (error instanceof CustomError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      throw mapAIEngineError(error);
    }

    logger.error('Unexpected error during image analysis:', error);
    throw new CustomError(
      'Unexpected error during analysis',
      500,
      'ANALYSIS_FAILED'
    );
  }
};

/**
 * Analyze video using AI Engine
 */
export const analyzeVideo = async (filePath: string): Promise<any> => {
  try {
    checkCircuitBreaker();

    logger.info(`Sending video to AI Engine: ${filePath}`);

    // Create form data
    const formData = new FormData();
    formData.append('video', fs.createReadStream(filePath));

    // Send request with extended timeout for videos
    const response = await aiEngineClient.post('/analyze/video', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: AI_ENGINE_TIMEOUT * 2, // Double timeout for videos
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    recordSuccess();
    logger.info('Video analysis completed successfully');

    return response.data;
  } catch (error) {
    recordFailure();

    if (error instanceof CustomError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      throw mapAIEngineError(error);
    }

    logger.error('Unexpected error during video analysis:', error);
    throw new CustomError(
      'Unexpected error during analysis',
      500,
      'ANALYSIS_FAILED'
    );
  }
};

/**
 * Check AI Engine health
 */
export const checkAIEngineHealth = async (): Promise<any> => {
  try {
    const response = await aiEngineClient.get('/health', {
      timeout: 5000, // Short timeout for health checks
    });

    return response.data;
  } catch (error) {
    logger.error('AI Engine health check failed:', error);
    throw new CustomError(
      'AI Engine health check failed',
      503,
      'AI_ENGINE_UNAVAILABLE'
    );
  }
};

/**
 * Get circuit breaker status
 */
export const getCircuitBreakerStatus = () => {
  return {
    state: circuitBreaker.state,
    failures: circuitBreaker.failures,
    lastFailureTime: circuitBreaker.lastFailureTime,
  };
};

logger.info(`AI Engine client configured: ${AI_ENGINE_URL}`);
