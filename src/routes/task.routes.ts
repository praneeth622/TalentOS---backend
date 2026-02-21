import { Router } from 'express';
import { z } from 'zod';
import * as taskController from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

/**
 * Zod schema for creating task
 */
const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  deadline: z.string().datetime().optional(),
  skillRequired: z.string().optional(),
});

/**
 * Zod schema for updating task
 */
const updateTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').optional(),
  description: z.string().optional(),
  employeeId: z.string().min(1, 'Employee ID is required').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  deadline: z.string().datetime().optional(),
  skillRequired: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
});

/**
 * Zod schema for updating task status
 */
const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']),
});

/**
 * Zod schema for updating task txHash
 */
const updateTaskTxHashSchema = z.object({
  txHash: z.string().min(1, 'Transaction hash is required'),
});

/**
 * GET /api/tasks
 * Get all tasks for the authenticated organization
 * Optional query params: ?employeeId=xxx&status=TODO
 */
router.get('/', authMiddleware, taskController.getAllTasks);

/**
 * POST /api/tasks
 * Create a new task
 */
router.post(
  '/',
  authMiddleware,
  validate(createTaskSchema),
  taskController.createTask
);

/**
 * GET /api/tasks/:id
 * Get single task with employee info
 */
router.get('/:id', authMiddleware, taskController.getTaskById);

/**
 * PUT /api/tasks/:id
 * Update an existing task
 */
router.put(
  '/:id',
  authMiddleware,
  validate(updateTaskSchema),
  taskController.updateTask
);

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', authMiddleware, taskController.deleteTask);

/**
 * PATCH /api/tasks/:id/status
 * Update task status only
 * Automatically sets completedAt when status becomes COMPLETED
 */
router.patch(
  '/:id/status',
  authMiddleware,
  validate(updateTaskStatusSchema),
  taskController.updateTaskStatus
);

/**
 * PATCH /api/tasks/:id/txhash
 * Store Web3 signature hash for task completion verification
 */
router.patch(
  '/:id/txhash',
  authMiddleware,
  validate(updateTaskTxHashSchema),
  taskController.updateTaskTxHash
);

export default router;
