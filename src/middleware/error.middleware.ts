import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { ErrorResponse } from '../types';

/**
 * Global error handling middleware
 * Catches all errors thrown in controllers and services
 * Returns consistent error response format
 */
export const errorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  const errorResponse: ErrorResponse = {
    success: false,
    error: message,
    statusCode,
  };

  if (process.env.NODE_ENV === 'development' && err.stack) {
    (errorResponse as any).stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};
