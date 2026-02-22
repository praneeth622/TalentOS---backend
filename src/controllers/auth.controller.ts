import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import { SuccessResponse, AuthResponse, AuthRequest } from '../types';

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

/**
 * Employee login controller
 */
export const loginEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginEmployee(email, password);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Employee login successful',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password controller (employee only)
 */
export const changePasswordController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = req.org!.employeeId!;
    const orgId = req.org!.orgId;
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(employeeId, orgId, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};
