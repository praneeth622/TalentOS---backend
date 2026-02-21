import { Router } from 'express';
import { z } from 'zod';
import * as employeeController from '../controllers/employee.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

const router = Router();

/**
 * Zod schema for creating employee
 */
const createEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  role: z.string().min(2, 'Role must be at least 2 characters'),
  department: z.string().min(2, 'Department must be at least 2 characters'),
  skills: z.array(z.string()).default([]),
  walletAddress: z.string().optional(),
});

/**
 * Zod schema for updating employee
 */
const updateEmployeeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.string().min(2, 'Role must be at least 2 characters').optional(),
  department: z.string().min(2, 'Department must be at least 2 characters').optional(),
  skills: z.array(z.string()).optional(),
  walletAddress: z.string().optional(),
});

/**
 * GET /api/employees
 * Get all employees for the authenticated organization
 */
router.get('/', authMiddleware, employeeController.getAllEmployees);

/**
 * POST /api/employees
 * Create a new employee
 */
router.post(
  '/',
  authMiddleware,
  validate(createEmployeeSchema),
  employeeController.createEmployee
);

/**
 * GET /api/employees/:id
 * Get single employee with all their tasks
 */
router.get('/:id', authMiddleware, employeeController.getEmployeeById);

/**
 * PUT /api/employees/:id
 * Update an existing employee
 */
router.put(
  '/:id',
  authMiddleware,
  validate(updateEmployeeSchema),
  employeeController.updateEmployee
);

/**
 * DELETE /api/employees/:id
 * Delete an employee
 */
router.delete('/:id', authMiddleware, employeeController.deleteEmployee);

/**
 * GET /api/employees/:id/score
 * Get employee's productivity score
 */
router.get('/:id/score', authMiddleware, employeeController.getEmployeeScore);

export default router;
