import { Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';

/**
 * Middleware that restricts access to admin (Organization) users only.
 * Must be used after authMiddleware.
 * If the JWT contains an employeeId, the caller is an employee — deny access.
 */
export const requireAdmin = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (req.org?.employeeId) {
    throw new AppError('Admin access required', 403);
  }
  next();
};
