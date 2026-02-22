import { Router } from 'express';
import { z } from 'zod';
import * as aiController from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/requireAdmin.middleware';
import { requireEmployee } from '../middleware/requireEmployee.middleware';
import { validate } from '../middleware/validate.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

/**
 * Zod schema for AI chat
 */
const aiChatSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
});

/**
 * Zod schema for smart task assignment
 */
const smartAssignSchema = z.object({
  taskTitle: z.string().min(3, 'Task title must be at least 3 characters'),
  skillRequired: z.string().min(2, 'Skill required must be at least 2 characters'),
});

/**
 * POST /api/ai/chat
 * General HR intelligence assistant
 * Ask questions about team, employees, or organization
 */
router.post('/chat', authMiddleware, requireAdmin, validate(aiChatSchema), aiController.aiChat);

/**
 * GET /api/ai/skill-gap/me
 * Employee-scoped skill gap — missing skills + personal 30-day learning plan.
 * Accessible by employees only. Cached 24 h per employee.
 */
router.get('/skill-gap/me', authMiddleware, requireEmployee, aiController.analyzeMySkillGap);

/**
 * GET /api/ai/skill-gap
 * Analyze skill gaps across the organization
 * Returns missing skills per employee and organizational recommendations
 * Cached for 24 hours
 */
router.get('/skill-gap', authMiddleware, requireAdmin, aiController.analyzeSkillGap);

/**
 * GET /api/ai/daily-insight
 * Get daily actionable HR insight
 * Based on organization statistics and performance
 * Cached for 24 hours
 */
router.get('/daily-insight', authMiddleware, requireAdmin, aiController.getDailyInsight);

/**
 * POST /api/ai/smart-assign
 * Get AI recommendation for task assignment
 * Suggests best employee based on skills and workload
 */
router.post(
  '/smart-assign',
  authMiddleware,
  requireAdmin,
  validate(smartAssignSchema),
  aiController.smartAssign
);

/**
 * POST /api/ai/extract-skills
 * Parse a resume PDF and extract skills, name, role, and summary using Gemini
 * Accepts multipart/form-data — field name: "resume", type: PDF, max 5MB
 * No caching — each upload is processed fresh
 */
router.post(
  '/extract-skills',
  authMiddleware,
  upload.single('resume'),
  aiController.extractSkillsController
);

export default router;
