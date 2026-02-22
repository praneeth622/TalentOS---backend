import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import {
  TaskData,
  TaskWithEmployee,
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  UpdateTaskTxHashInput,
  TaskFilters,
} from '../types';

/**
 * Get all tasks for an organization with optional filters
 * Always scoped by orgId from JWT
 * Supports filtering by employeeId and status via query params
 * 
 * @param orgId - Organization ID from JWT token
 * @param filters - Optional filters (employeeId, status)
 * @returns Array of tasks with employee info
 */
export const getAllTasks = async (
  orgId: string,
  filters?: TaskFilters
): Promise<TaskWithEmployee[]> => {
  const where: any = { orgId };

  if (filters?.employeeId) {
    where.employeeId = filters.employeeId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  const tasks = await prisma.task.findMany({
    where,
    select: {
      id: true,
      orgId: true,
      employeeId: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      completedAt: true,
      txHash: true,
      skillRequired: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tasks;
};

/**
 * Get single task by ID
 * Scoped by orgId to prevent cross-org access
 * 
 * @param taskId - Task ID
 * @param orgId - Organization ID from JWT token
 * @returns Task with employee info
 * @throws AppError if task not found or belongs to different org
 */
export const getTaskById = async (
  taskId: string,
  orgId: string
): Promise<TaskWithEmployee> => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      orgId,
    },
    select: {
      id: true,
      orgId: true,
      employeeId: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      completedAt: true,
      txHash: true,
      skillRequired: true,
      createdAt: true,
      updatedAt: true,
      employee: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  return task;
};

/**
 * Create a new task
 * Validates that employee belongs to the same organization
 * 
 * @param input - Task data
 * @param orgId - Organization ID from JWT token
 * @returns Created task
 * @throws AppError if employee not found or belongs to different org
 */
export const createTask = async (
  input: CreateTaskInput,
  orgId: string
): Promise<TaskData> => {
  const employee = await prisma.employee.findFirst({
    where: {
      id: input.employeeId,
      orgId,
    },
  });

  if (!employee) {
    throw new AppError('Employee not found in your organization', 404);
  }

  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      employeeId: input.employeeId,
      priority: input.priority || 'MEDIUM',
      deadline: input.deadline ? new Date(input.deadline) : null,
      skillRequired: input.skillRequired,
      orgId,
    },
    select: {
      id: true,
      orgId: true,
      employeeId: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      completedAt: true,
      txHash: true,
      skillRequired: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return task;
};

/**
 * Update an existing task
 * Scoped by orgId to prevent cross-org updates
 * Validates employeeId if changed
 * 
 * @param taskId - Task ID
 * @param input - Fields to update
 * @param orgId - Organization ID from JWT token
 * @returns Updated task
 * @throws AppError if task or employee not found
 */
export const updateTask = async (
  taskId: string,
  input: UpdateTaskInput,
  orgId: string
): Promise<TaskData> => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      orgId,
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (input.employeeId && input.employeeId !== task.employeeId) {
    const employee = await prisma.employee.findFirst({
      where: {
        id: input.employeeId,
        orgId,
      },
    });

    if (!employee) {
      throw new AppError('Employee not found in your organization', 404);
    }
  }

  const updateData: any = { ...input };
  
  if (input.deadline) {
    updateData.deadline = new Date(input.deadline);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    select: {
      id: true,
      orgId: true,
      employeeId: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      completedAt: true,
      txHash: true,
      skillRequired: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
};

/**
 * Delete a task
 * Scoped by orgId to prevent cross-org deletion
 * 
 * @param taskId - Task ID
 * @param orgId - Organization ID from JWT token
 * @throws AppError if task not found
 */
export const deleteTask = async (
  taskId: string,
  orgId: string
): Promise<void> => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      orgId,
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  await prisma.task.delete({
    where: { id: taskId },
  });
};

/**
 * Update task status
 * Automatically sets completedAt when status becomes COMPLETED
 * Scoped by orgId for security
 * 
 * @param taskId - Task ID
 * @param input - Status update data
 * @param orgId - Organization ID from JWT token
 * @returns Updated task
 * @throws AppError if task not found
 */
export const updateTaskStatus = async (
  taskId: string,
  input: UpdateTaskStatusInput,
  orgId: string,
  requesterId?: string
): Promise<TaskData> => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      orgId,
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (requesterId && task.employeeId !== requesterId) {
    throw new AppError('You can only update your own tasks', 403);
  }

  const updateData: any = { status: input.status };

  if (input.status === 'COMPLETED' && !task.completedAt) {
    updateData.completedAt = new Date();
  }

  if (input.status !== 'COMPLETED' && task.completedAt) {
    updateData.completedAt = null;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    select: {
      id: true,
      orgId: true,
      employeeId: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      completedAt: true,
      txHash: true,
      skillRequired: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
};

/**
 * Get tasks for the authenticated employee
 */
export const getMyTasks = async (employeeId: string, orgId: string) => {
  const tasks = await prisma.task.findMany({
    where: { employeeId, orgId },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      completedAt: true,
      txHash: true,
      skillRequired: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return tasks;
};

/**
 * Update task txHash (Web3 signature)
 * Used when employee signs task completion on blockchain
 * Scoped by orgId for security
 * 
 * @param taskId - Task ID
 * @param input - TxHash data
 * @param orgId - Organization ID from JWT token
 * @returns Updated task
 * @throws AppError if task not found
 */
export const updateTaskTxHash = async (
  taskId: string,
  input: UpdateTaskTxHashInput,
  orgId: string,
  requesterId?: string
): Promise<TaskData> => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      orgId,
    },
  });

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  if (requesterId && task.employeeId !== requesterId) {
    throw new AppError('You can only update your own tasks', 403);
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { txHash: input.txHash },
    select: {
      id: true,
      orgId: true,
      employeeId: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      deadline: true,
      completedAt: true,
      txHash: true,
      skillRequired: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
};
