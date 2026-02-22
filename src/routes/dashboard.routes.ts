import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/requireAdmin.middleware';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Get organization dashboard statistics
 * Returns: totalEmployees, activeEmployees, assignedTasks, completedTasks
 */
router.get('/stats', authMiddleware, dashboardController.getDashboardStats);

/**
 * GET /api/dashboard/leaderboard
 * Get top 5 employees ranked by productivity score
 * Returns: Array of employees with scores and task counts
 */
router.get('/leaderboard', authMiddleware, requireAdmin, dashboardController.getLeaderboard);

/**
 * GET /api/dashboard/activity
 * Get recent activity log (last 10 tasks)
 * Returns: Array of tasks ordered by updatedAt desc with employee names
 */
router.get('/activity', authMiddleware, dashboardController.getRecentActivity);

export default router;
