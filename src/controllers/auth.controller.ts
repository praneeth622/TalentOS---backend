import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { SuccessResponse, AuthResponse } from '../types';

/**
 * Register controller
 * Thin wrapper that calls auth service and returns response
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    const result = await authService.registerOrganization(data);

    const response: SuccessResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Organization registered successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Login controller
 * Thin wrapper that calls auth service and returns response
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    const result = await authService.loginOrganization(data);

    const response: SuccessResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Login successful',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
