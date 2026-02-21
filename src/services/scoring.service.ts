import { prisma } from '../lib/prisma';

/**
 * Task statistics for scoring calculation
 */
interface TaskStats {
  totalTasks: number;
  completedTasks: number;
  onTimeTasks: number;
  highPriorityTotal: number;
  highPriorityCompleted: number;
}

/**
 * Productivity score breakdown
 */
export interface ProductivityScore {
  finalScore: number;
  completionRate: number;
  deadlineScore: number;
  priorityScore: number;
  breakdown: {
    totalTasks: number;
    completedTasks: number;
    onTimeTasks: number;
    highPriorityCompleted: number;
    highPriorityTotal: number;
  };
}

/**
 * Calculate productivity score for an employee
 * Formula (per TalentOS AI rules):
 * - completionRate = (completedTasks / totalTasks) * 40
 * - deadlineScore = (onTimeTasks / completedTasks) * 35
 * - priorityScore = (highPriorityCompleted / highPriorityTotal) * 25
 * 
 * Edge cases:
 * - If totalTasks = 0, score = 0
 * - If no high priority tasks, redistribute 25 points to completionRate
 * - Score is always 0-100
 * 
 * @param employeeId - Employee ID to calculate score for
 * @param orgId - Organization ID for scoping
 * @returns Productivity score with breakdown
 */
export const calculateProductivityScore = async (
  employeeId: string,
  orgId: string
): Promise<ProductivityScore> => {
  const allTasks = await prisma.task.findMany({
    where: {
      employeeId,
      orgId,
    },
    select: {
      id: true,
      status: true,
      priority: true,
      deadline: true,
      completedAt: true,
    },
  });

  const stats: TaskStats = {
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter(t => t.status === 'COMPLETED').length,
    onTimeTasks: allTasks.filter(t => 
      t.status === 'COMPLETED' && 
      t.completedAt && 
      t.deadline && 
      t.completedAt <= t.deadline
    ).length,
    highPriorityTotal: allTasks.filter(t => t.priority === 'HIGH').length,
    highPriorityCompleted: allTasks.filter(t => 
      t.status === 'COMPLETED' && t.priority === 'HIGH'
    ).length,
  };

  if (stats.totalTasks === 0) {
    return {
      finalScore: 0,
      completionRate: 0,
      deadlineScore: 0,
      priorityScore: 0,
      breakdown: stats,
    };
  }

  let completionWeight = 40;
  let priorityWeight = 25;

  if (stats.highPriorityTotal === 0) {
    completionWeight = 65;
    priorityWeight = 0;
  }

  const completionRate = (stats.completedTasks / stats.totalTasks) * completionWeight;
  
  const deadlineScore = stats.completedTasks > 0
    ? (stats.onTimeTasks / stats.completedTasks) * 35
    : 0;
  
  const priorityScore = stats.highPriorityTotal > 0
    ? (stats.highPriorityCompleted / stats.highPriorityTotal) * priorityWeight
    : 0;

  const finalScore = Math.round(completionRate + deadlineScore + priorityScore);

  return {
    finalScore: Math.min(100, Math.max(0, finalScore)),
    completionRate: Math.round(completionRate),
    deadlineScore: Math.round(deadlineScore),
    priorityScore: Math.round(priorityScore),
    breakdown: stats,
  };
};
