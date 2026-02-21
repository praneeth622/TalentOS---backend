import { Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service';
import { AuthRequest, SuccessResponse } from '../types';

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
    const result = await aiService.analyzeSkillGap(orgId);

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
    const result = await aiService.getDailyInsight(orgId);

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
