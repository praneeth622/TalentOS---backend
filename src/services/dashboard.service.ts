import { prisma } from '../lib/prisma';
import { calculateProductivityScore } from './scoring.service';
import { AppError } from '../utils/AppError';
import { DashboardStats, LeaderboardEmployee, ActivityLog } from '../types';

/**
 * Get dashboard statistics for organization
 * Returns aggregate counts for employees and tasks
 * 
 * @param orgId - Organization ID from JWT token
 * @returns Dashboard statistics object
 */
export const getDashboardStats = async (orgId: string): Promise<DashboardStats> => {
  const [totalEmployees, tasks] = await Promise.all([
    prisma.employee.count({
      where: { orgId },
    }),
    prisma.task.findMany({
      where: { orgId },
      select: {
        id: true,
        status: true,
        employeeId: true,
      },
    }),
  ]);

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const assignedTasks = tasks.length;

  const uniqueEmployeeIds = new Set(tasks.map(t => t.employeeId));
  const activeEmployees = uniqueEmployeeIds.size;

  return {
    totalEmployees,
    activeEmployees,
    assignedTasks,
    completedTasks,
  };
};

/**
 * Get top 5 employees ranked by productivity score
 * Uses calculateProductivityScore for each employee
 * Filters out employees with no tasks
 * 
 * @param orgId - Organization ID from JWT token
 * @returns Array of top 5 employees with scores
 */
export const getLeaderboard = async (orgId: string): Promise<LeaderboardEmployee[]> => {
  const employees = await prisma.employee.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  const employeesWithScores = await Promise.all(
    employees.map(async (employee) => {
      const score = await calculateProductivityScore(employee.id, orgId);
      
      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        productivityScore: score.finalScore,
        completedTasks: score.breakdown.completedTasks,
        totalTasks: score.breakdown.totalTasks,
      };
    })
  );

  const leaderboard = employeesWithScores
    .filter(emp => emp.totalTasks > 0)
    .sort((a, b) => b.productivityScore - a.productivityScore)
    .slice(0, 5);

  return leaderboard;
};

/**
 * Get recent activity log
 * Returns last 10 tasks ordered by updatedAt descending
 * Includes employee name for each task
 * 
 * @param orgId - Organization ID from JWT token
 * @returns Array of recent task activities
 */
export const getRecentActivity = async (orgId: string): Promise<ActivityLog[]> => {
  const tasks = await prisma.task.findMany({
    where: { orgId },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      updatedAt: true,
      employeeId: true,
      employee: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 10,
  });

  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    updatedAt: task.updatedAt,
    employeeName: task.employee.name,
    employeeId: task.employeeId,
  }));
};

/**
 * Get dashboard stats for an employee
 */
export const getEmployeeDashboardStats = async (employeeId: string, orgId: string) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, orgId },
    select: {
      id: true,
      name: true,
      role: true,
      department: true,
      skills: true,
      tasks: {
        select: { status: true, priority: true, deadline: true, completedAt: true, updatedAt: true, title: true },
      },
    },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const { tasks } = employee;
  const assignedTasks = tasks.filter(t => t.status === 'TODO').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const totalTasks = tasks.length;

  const score = await calculateProductivityScore(employeeId, orgId);

  const recentActivity = [...tasks]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5)
    .map(t => ({ title: t.title, status: t.status, updatedAt: t.updatedAt }));

  return {
    assignedTasks,
    inProgressTasks,
    completedTasks,
    totalTasks,
    productivityScore: score.finalScore,
    recentActivity,
  };
};

/**
 * Get recent activity for a specific employee
 */
export const getMyRecentActivity = async (employeeId: string, orgId: string): Promise<ActivityLog[]> => {
  const tasks = await prisma.task.findMany({
    where: { employeeId, orgId },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      updatedAt: true,
      employeeId: true,
      employee: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 10,
  });

  return tasks.map(task => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    updatedAt: task.updatedAt,
    employeeName: task.employee.name,
    employeeId: task.employeeId,
  }));
};
