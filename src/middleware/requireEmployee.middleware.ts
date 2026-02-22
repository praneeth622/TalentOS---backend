import { Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../types';

/**
 * Middleware that restricts access to employee users only.
 * Must be used after authMiddleware.
 * If the JWT does NOT contain an employeeId, the caller is an admin — deny access.
 */
export const requireEmployee = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.org?.employeeId) {
    throw new AppError('Employee access required', 403);
  }
  next();
};
