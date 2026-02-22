import { Router } from 'express';
import { z } from 'zod';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireEmployee } from '../middleware/requireEmployee.middleware';

const router = Router();

/**
 * Zod schema for organization registration
 */
const registerSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * Zod schema for organization login
 */
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register
 * Register a new organization
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * POST /api/auth/login
 * Login an existing organization
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * Zod schema for employee login
 */
const employeeLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Zod schema for change password
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

/**
 * POST /api/auth/employee-login
 * Login an employee
 */
router.post('/employee-login', validate(employeeLoginSchema), authController.loginEmployeeController);

/**
 * POST /api/auth/change-password
 * Change employee password (requires employee auth)
 */
router.post('/change-password', authMiddleware, requireEmployee, validate(changePasswordSchema), authController.changePasswordController);

export default router;
