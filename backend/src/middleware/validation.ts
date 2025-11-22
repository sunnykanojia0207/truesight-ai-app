import { Request, Response, NextFunction } from 'express';
import { CustomError } from './errorHandler.js';

/**
 * Sanitize string input to prevent XSS and injection attacks
 */
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 10000); // Limit length
};

/**
 * Validate and sanitize request body
 */
export const validateRequestBody = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if body exists for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.body) {
      throw new CustomError(
        'Request body is required',
        400,
        'MISSING_BODY'
      );
    }

    // Sanitize string fields in body
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeString(req.body[key]);
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate MongoDB ObjectId format
 */
export const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Middleware to validate ObjectId parameters
 */
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];

    if (!id) {
      return next(new CustomError(
        `${paramName} is required`,
        400,
        'MISSING_PARAMETER'
      ));
    }

    if (!isValidObjectId(id)) {
      return next(new CustomError(
        `Invalid ${paramName} format`,
        400,
        'INVALID_ID_FORMAT',
        { [paramName]: id }
      ));
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    if (isNaN(page) || page < 1) {
      throw new CustomError(
        'Invalid page parameter. Must be a positive integer',
        400,
        'INVALID_PAGINATION'
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      throw new CustomError(
        'Invalid limit parameter. Must be between 1 and 100',
        400,
        'INVALID_PAGINATION'
      );
    }

    // Attach validated values to request
    req.query.page = page.toString();
    req.query.limit = limit.toString();

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate content type for file uploads
 */
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentType = req.headers['content-type'];

    if (!contentType) {
      return next(new CustomError(
        'Content-Type header is required',
        400,
        'MISSING_CONTENT_TYPE'
      ));
    }

    const isAllowed = allowedTypes.some(type => contentType.includes(type));

    if (!isAllowed) {
      return next(new CustomError(
        `Invalid Content-Type. Allowed types: ${allowedTypes.join(', ')}`,
        400,
        'INVALID_CONTENT_TYPE',
        { contentType, allowedTypes }
      ));
    }

    next();
  };
};

/**
 * Prevent common injection attacks in query parameters
 */
export const sanitizeQueryParams = (req: Request, res: Response, next: NextFunction) => {
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key] as string);
      }
    }
  }
  next();
};
