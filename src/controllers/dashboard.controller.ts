import { Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { AuthRequest, SuccessResponse } from '../types';

/**
 * Get dashboard statistics controller
 * Returns aggregate employee and task counts
 * Thin wrapper that calls dashboard service and returns response
 */
export const getDashboardStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = req.org!.orgId;

    if (req.org!.employeeId) {
      const stats = await dashboardService.getEmployeeDashboardStats(req.org!.employeeId, orgId);
      res.status(200).json({ success: true, data: stats });
      return;
    }

    const stats = await dashboardService.getDashboardStats(orgId);

    const response: SuccessResponse = {
      success: true,
      data: stats,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get leaderboard controller
 * Returns top 5 employees ranked by productivity score
 * Thin wrapper that calls dashboard service and returns response
 */
export const getLeaderboard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = req.org!.orgId;
    const leaderboard = await dashboardService.getLeaderboard(orgId);

    const response: SuccessResponse = {
      success: true,
      data: leaderboard,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent activity controller
 * Returns last 10 tasks with employee names
 * Thin wrapper that calls dashboard service and returns response
 */
export const getRecentActivity = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = req.org!.orgId;

    if (req.org!.employeeId) {
      const activity = await dashboardService.getMyRecentActivity(req.org!.employeeId, orgId);
      res.status(200).json({ success: true, data: activity });
      return;
    }

    const activity = await dashboardService.getRecentActivity(orgId);

    const response: SuccessResponse = {
      success: true,
      data: activity,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
