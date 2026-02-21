import { Response, NextFunction } from 'express';
import * as employeeService from '../services/employee.service';
import { AuthRequest, SuccessResponse } from '../types';

/**
 * Get all employees controller
 * Thin wrapper that calls employee service and returns response
 */
export const getAllEmployees = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = req.org!.orgId;
    const employees = await employeeService.getAllEmployees(orgId);

    const response: SuccessResponse = {
      success: true,
      data: employees,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single employee with tasks controller
 * Thin wrapper that calls employee service and returns response
 */
export const getEmployeeById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const orgId = req.org!.orgId;
    const employee = await employeeService.getEmployeeById(id, orgId);

    const response: SuccessResponse = {
      success: true,
      data: employee,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Create employee controller
 * Thin wrapper that calls employee service and returns response
 */
export const createEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    const orgId = req.org!.orgId;
    const employee = await employeeService.createEmployee(data, orgId);

    const response: SuccessResponse = {
      success: true,
      data: employee,
      message: 'Employee created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Update employee controller
 * Thin wrapper that calls employee service and returns response
 */
export const updateEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const orgId = req.org!.orgId;
    const employee = await employeeService.updateEmployee(id, data, orgId);

    const response: SuccessResponse = {
      success: true,
      data: employee,
      message: 'Employee updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete employee controller
 * Thin wrapper that calls employee service and returns response
 */
export const deleteEmployee = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const orgId = req.org!.orgId;
    await employeeService.deleteEmployee(id, orgId);

    const response: SuccessResponse = {
      success: true,
      data: null,
      message: 'Employee deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get employee productivity score controller
 * Thin wrapper that calls employee service and returns response
 */
export const getEmployeeScore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const orgId = req.org!.orgId;
    const score = await employeeService.getEmployeeScore(id, orgId);

    const response: SuccessResponse = {
      success: true,
      data: score,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
