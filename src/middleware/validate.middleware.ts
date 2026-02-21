import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Validation middleware factory using Zod schemas
 * Validates request body against the provided schema
 * Returns 400 error if validation fails
 * 
 * @param schema - Zod schema to validate against
 */
export const validate = (schema: ZodSchema) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error: any) {
      if (error.errors && Array.isArray(error.errors)) {
        const messages = error.errors.map((err: any) => 
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');
        next(new AppError(messages, 400));
      } else {
        next(new AppError('Validation failed', 400));
      }
    }
  };
};
