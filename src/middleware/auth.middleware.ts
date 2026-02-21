import { Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Attaches decoded token payload to req.org
 * 
 * Usage: All protected routes must use this middleware
 * Never trust orgId from request body - always use req.org.orgId
 */
export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.substring(7);

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = verifyToken(token);
    req.org = decoded;

    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
    } else if (error.name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};
