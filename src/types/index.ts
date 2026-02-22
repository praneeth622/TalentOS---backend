import { Request } from 'express';

/**
 * JWT token payload structure
 */
export interface JwtPayload {
  orgId: string;
  email: string;
  employeeId?: string;
  roleType?: string;
  iat?: number;
  exp?: number;
}

/**
 * Extended Express Request with organization data from JWT
 */
export interface AuthRequest extends Request {
  org?: JwtPayload;
}

/**
 * Standard API success response
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Standard API error response
 */
export interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
}

/**
 * Standard API list response with pagination
 */
export interface ListResponse<T = any> {
  success: true;
  data: T[];
  total: number;
  page: number;
}

/**
 * Organization registration input
 */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Organization login input
 */
export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Auth response with token
 */
export interface AuthResponse {
  token: string;
  organization: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Employee data (without sensitive fields)
 */
export interface EmployeeData {
  id: string;
  orgId: string;
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  walletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create employee input
 */
export interface CreateEmployeeInput {
  name: string;
  email: string;
  role: string;
  department: string;
  skills: string[];
  walletAddress?: string;
}

/**
 * Update employee input
 */
export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  skills?: string[];
  walletAddress?: string;
}

/**
 * Employee with tasks
 */
export interface EmployeeWithTasks extends EmployeeData {
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    deadline: Date | null;
    completedAt: Date | null;
  }>;
}

/**
 * Task data
 */
export interface TaskData {
  id: string;
  orgId: string;
  employeeId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  deadline: Date | null;
  completedAt: Date | null;
  txHash: string | null;
  skillRequired: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task with employee info
 */
export interface TaskWithEmployee extends TaskData {
  employee: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Create task input
 */
export interface CreateTaskInput {
  title: string;
  description?: string;
  employeeId: string;
  priority?: string;
  deadline?: string;
  skillRequired?: string;
}

/**
 * Update task input
 */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  employeeId?: string;
  priority?: string;
  deadline?: string;
  skillRequired?: string;
  status?: string;
}

/**
 * Update task status input
 */
export interface UpdateTaskStatusInput {
  status: string;
}

/**
 * Update task txHash input
 */
export interface UpdateTaskTxHashInput {
  txHash: string;
}

/**
 * Task query filters
 */
export interface TaskFilters {
  employeeId?: string;
  status?: string;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  assignedTasks: number;
  completedTasks: number;
}

/**
 * Leaderboard employee entry
 */
export interface LeaderboardEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  productivityScore: number;
  completedTasks: number;
  totalTasks: number;
}

/**
 * Activity log entry
 */
export interface ActivityLog {
  id: string;
  title: string;
  status: string;
  priority: string;
  updatedAt: Date;
  employeeName: string;
  employeeId: string;
}

/**
 * AI chat request
 */
export interface AiChatInput {
  question: string;
}

/**
 * AI chat response
 */
export interface AiChatResponse {
  answer: string;
}

/**
 * Skill gap analysis
 */
export interface SkillGap {
  employeeName: string;
  role: string;
  missingSkills: string[];
}

/**
 * Skill gap analysis response
 */
export interface SkillGapResponse {
  gaps: SkillGap[];
  orgRecommendation: string;
}

/**
 * Daily insight response
 */
export interface DailyInsightResponse {
  insight: string;
}

/**
 * Smart task assignment input
 */
export interface SmartAssignInput {
  taskTitle: string;
  skillRequired: string;
}

/**
 * Smart task assignment response
 */
export interface SmartAssignResponse {
  recommendedEmployee: string;
  reason: string;
}

/**
 * PDF skill extraction result
 */
export interface ExtractSkillsResult {
  skills: string[];
  name: string;
  role: string;
  summary: string;
}
