import { Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service';
import { AuthRequest, SuccessResponse } from '../types';
import { AppError } from '../utils/AppError';

/**
 * AI Chat controller
 * General HR intelligence assistant
 * Thin wrapper that calls AI service and returns response
 */
export const aiChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    const orgId = req.org!.orgId;
    const result = await aiService.aiChat(data, orgId);

    const response: SuccessResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Skill Gap Analysis controller
 * Analyzes missing skills per employee
 * Thin wrapper that calls AI service and returns response
 */
export const analyzeSkillGap = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = req.org!.orgId;
    const forceRefresh = req.query.refresh === 'true';
    const result = await aiService.analyzeSkillGap(orgId, forceRefresh);

    const response: SuccessResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Daily Insight controller
 * Generates actionable HR insight
 * Thin wrapper that calls AI service and returns response
 */
export const getDailyInsight = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = req.org!.orgId;
    const forceRefresh = req.query.refresh === 'true';
    const result = await aiService.getDailyInsight(orgId, forceRefresh);

    const response: SuccessResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Smart Task Assignment controller
 * Recommends best employee for a task
 * Thin wrapper that calls AI service and returns response
 */
export const smartAssign = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;
    const orgId = req.org!.orgId;
    const result = await aiService.smartAssign(data, orgId);

    const response: SuccessResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Employee skill gap controller
 * Returns missing skills and a personal 30-day learning plan for the calling employee.
 */
export const analyzeMySkillGap = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const employeeId = req.org!.employeeId!;
    const orgId = req.org!.orgId;
    const forceRefresh = req.query.refresh === 'true';
    const result = await aiService.analyzeEmployeeSkillGap(employeeId, orgId, forceRefresh);

    const response: SuccessResponse = { success: true, data: result };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Extract skills from a resume PDF controller
 * Accepts multipart/form-data with field "resume" (PDF only, max 5MB)
 * Thin wrapper that passes the multer buffer to the AI service
 */
export const extractSkillsController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new AppError('Please upload a PDF file', 400);
    }

    const result = await aiService.extractSkillsFromPDF(req.file.buffer);

    const response: SuccessResponse = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
