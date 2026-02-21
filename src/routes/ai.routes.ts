import { Router } from 'express';
import { z } from 'zod';
import * as aiController from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';

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
router.post('/chat', authMiddleware, validate(aiChatSchema), aiController.aiChat);

/**
 * GET /api/ai/skill-gap
 * Analyze skill gaps across the organization
 * Returns missing skills per employee and organizational recommendations
 * Cached for 24 hours
 */
router.get('/skill-gap', authMiddleware, aiController.analyzeSkillGap);

/**
 * GET /api/ai/daily-insight
 * Get daily actionable HR insight
 * Based on organization statistics and performance
 * Cached for 24 hours
 */
router.get('/daily-insight', authMiddleware, aiController.getDailyInsight);

/**
 * POST /api/ai/smart-assign
 * Get AI recommendation for task assignment
 * Suggests best employee based on skills and workload
 */
router.post(
  '/smart-assign',
  authMiddleware,
  validate(smartAssignSchema),
  aiController.smartAssign
);

export default router;
