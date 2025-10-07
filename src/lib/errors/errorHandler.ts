import type { Request, Response, NextFunction } from 'express';
import { ApiErrorClass } from './api-error'; 
import { errorResponse } from '../app/response';
import { type Logger } from '../app/logger';
import { config } from '../../../configs';
import { container } from 'tsyringe';
import { TOKENS } from '../app/di-tokens';


/**
 * Global error handler middleware
 * This should be the last middleware in your Express app
 */
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const logger = container.resolve(TOKENS.Logger) as Logger;

  // Handle not found errors
  if (error.message?.toLowerCase().includes('not found')) {
    const apiError = new ApiErrorClass(error.message, 404, {cause: error, stackOptions: {
      includeNodeInternals: false,
      includeNodeModules: false
    }});
    const response = errorResponse(error.message, apiError);
    res.status(404).json(response);
    return;
  }

  // Handle validation errors (from Zod or other validators)
  if (error.name === 'ValidationError' || error.name === 'ZodError') {
    const apiError = new ApiErrorClass('Validation failed', 400, {cause: error, stackOptions: {
      includeNodeInternals: false,
      includeNodeModules: false
    }});
    const response = errorResponse('Validation failed', apiError);
    res.status(400).json(response);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    const apiError = new ApiErrorClass('Invalid or expired token', 401, {cause: error, stackOptions: {
      includeNodeInternals: false,
      includeNodeModules: false
    }});
    const response = errorResponse('Authentication failed', apiError);
    res.status(401).json(response);
    return;
  }

  // Log the error with details only if it's not an instance of ApiErrorClass
  // or if it's a server error (5xx)
  // This avoids logging expected client errors (4xx) multiple times
  if (!(error instanceof ApiErrorClass) || error.statusCode >= 500) {
    logger.error('Global error handler caught error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      req: {
        headers : JSON.stringify(req.headers),
        url: JSON.stringify(req.url),
        body: JSON.stringify(req.body),
      }
    });
  }

  // Handle API errors
  if (error instanceof ApiErrorClass) {
    const response = errorResponse(error.message, error);
    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Sequelize errors
  if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
    const apiError = new ApiErrorClass('Database validation failed', 400, {cause: error, stackOptions: {
      includeNodeInternals: false,
      includeNodeModules: false
    }});
    const response = errorResponse('Database validation error', apiError);
    res.status(400).json(response);
    return;
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    const apiError = new ApiErrorClass('Foreign key constraint violation', 400, {cause: error, stackOptions: {
      includeNodeInternals: false,
      includeNodeModules: false
    }});
    const response = errorResponse('Related record not found', apiError);
    res.status(400).json(response);
    return;
  }

  if (error.name === 'SequelizeDatabaseError') {
    const apiError = new ApiErrorClass('Database operation failed', 500, {cause: error, stackOptions: {
      includeNodeInternals: false,
      includeNodeModules: false
    }} );
    const response = errorResponse('Database error', apiError);
    res.status(500).json(response);
    return;
  }

  // Default error handling - don't expose internal details in production
  const message = config.app.ENV === 'production' 
    ? 'Internal server error' 
    : error.message || 'Internal server error';
  
  const apiError = new ApiErrorClass(message, 500, {cause: error, stackOptions: {
      includeNodeInternals: false,
      includeNodeModules: false
    }});
  const response = errorResponse('An unexpected error occurred', apiError);
  
  res.status(500).json(response);
};

/**
 * 404 Not Found handler
 * Use this before the global error handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const apiError = new ApiErrorClass(`Route ${req.method} ${req.path} not found`, 404);
  const response = errorResponse('Resource not found', apiError);
  res.status(404).json(response);
};

/**
 * Async error wrapper for route handlers
 * Use this to wrap async route handlers to catch async errors
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
