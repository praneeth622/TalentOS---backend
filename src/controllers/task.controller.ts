import { Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';
import { AuthRequest, SuccessResponse, TaskFilters } from '../types';

/**
 * Get all tasks controller
 * Supports optional query filters: ?employeeId=xxx&status=TODO
 * Thin wrapper that calls task service and returns response
 */
export const getAllTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = req.org!.orgId;
    
    const filters: TaskFilters = {};
    if (req.query.employeeId) {
      filters.employeeId = req.query.employeeId as string;
    }
    if (req.query.status) {
      filters.status = req.query.status as string;
    }

    const tasks = await taskService.getAllTasks(orgId, filters);

    const response: SuccessResponse = {
      success: true,
      data: tasks,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get single task controller
 * Thin wrapper that calls task service and returns response
 */
export const getTaskById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const orgId = req.org!.orgId;
    const task = await taskService.getTaskById(id, orgId);

    const response: SuccessResponse = {
      success: true,
      data: task,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Create task controller
 * Thin wrapper that calls task service and returns response
 */
export const createTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    const orgId = req.org!.orgId;
    const task = await taskService.createTask(data, orgId);

    const response: SuccessResponse = {
      success: true,
      data: task,
      message: 'Task created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Update task controller
 * Thin wrapper that calls task service and returns response
 */
export const updateTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const orgId = req.org!.orgId;
    const task = await taskService.updateTask(id, data, orgId);

    const response: SuccessResponse = {
      success: true,
      data: task,
      message: 'Task updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete task controller
 * Thin wrapper that calls task service and returns response
 */
export const deleteTask = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const orgId = req.org!.orgId;
    await taskService.deleteTask(id, orgId);

    const response: SuccessResponse = {
      success: true,
      data: null,
      message: 'Task deleted successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Update task status controller
 * Sets completedAt automatically when status becomes COMPLETED
 * Thin wrapper that calls task service and returns response
 */
export const updateTaskStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const orgId = req.org!.orgId;
    const task = await taskService.updateTaskStatus(id, data, orgId);

    const response: SuccessResponse = {
      success: true,
      data: task,
      message: 'Task status updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Update task txHash controller
 * Stores Web3 signature hash for task completion verification
 * Thin wrapper that calls task service and returns response
 */
export const updateTaskTxHash = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const data = req.body;
    const orgId = req.org!.orgId;
    const task = await taskService.updateTaskTxHash(id, data, orgId);

    const response: SuccessResponse = {
      success: true,
      data: task,
      message: 'Task verification hash updated successfully',
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
