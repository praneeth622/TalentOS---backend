import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import {
  EmployeeData,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  EmployeeWithTasks
} from '../types';
import { calculateProductivityScore, ProductivityScore } from './scoring.service';
import { generatePassword } from './auth.service';
import { sendWelcomeEmail } from './email.service';

/**
 * Get all employees for an organization
 * Always scoped by orgId from JWT
 * 
 * @param orgId - Organization ID from JWT token
 * @returns Array of employees (without sensitive fields)
 */
export const getAllEmployees = async (orgId: string): Promise<EmployeeData[]> => {
  const employees = await prisma.employee.findMany({
    where: { orgId },
    select: {
      id: true,
      orgId: true,
      name: true,
      email: true,
      role: true,
      department: true,
      skills: true,
      walletAddress: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return employees;
};

/**
 * Get single employee by ID with all their tasks
 * Scoped by orgId to prevent cross-org access
 * 
 * @param employeeId - Employee ID
 * @param orgId - Organization ID from JWT token
 * @returns Employee with tasks
 * @throws AppError if employee not found or belongs to different org
 */
export const getEmployeeById = async (
  employeeId: string,
  orgId: string
): Promise<EmployeeWithTasks> => {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      orgId,
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      email: true,
      role: true,
      department: true,
      skills: true,
      walletAddress: true,
      createdAt: true,
      updatedAt: true,
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          deadline: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  return employee;
};

/**
 * Create a new employee
 * Checks for duplicate email within org
 * 
 * @param input - Employee data
 * @param orgId - Organization ID from JWT token
 * @returns Created employee
 * @throws AppError if email already exists in org
 */
export const createEmployee = async (
  input: CreateEmployeeInput,
  orgId: string
): Promise<EmployeeData> => {
  const existingEmployee = await prisma.employee.findFirst({
    where: {
      orgId,
      email: input.email,
    },
  });

  if (existingEmployee) {
    throw new AppError('Employee with this email already exists in your organization', 409);
  }

  // Generate and hash a temporary password
  const plainPassword = generatePassword();
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const employee = await prisma.employee.create({
    data: {
      ...input,
      orgId,
      password: hashedPassword,
    },
    select: {
      id: true,
      orgId: true,
      name: true,
      email: true,
      role: true,
      department: true,
      skills: true,
      walletAddress: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Fetch org name and send welcome email (non-blocking)
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  });

  sendWelcomeEmail(employee.email, employee.name, plainPassword, org?.name || 'Your Organization');

  return employee;
};

/**
 * Update an existing employee
 * Scoped by orgId to prevent cross-org updates
 * 
 * @param employeeId - Employee ID
 * @param input - Fields to update
 * @param orgId - Organization ID from JWT token
 * @returns Updated employee
 * @throws AppError if employee not found or email conflict
 */
export const updateEmployee = async (
  employeeId: string,
  input: UpdateEmployeeInput,
  orgId: string
): Promise<EmployeeData> => {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      orgId,
    },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  if (input.email && input.email !== employee.email) {
    const emailTaken = await prisma.employee.findFirst({
      where: {
        orgId,
        email: input.email,
        id: { not: employeeId },
      },
    });

    if (emailTaken) {
      throw new AppError('Email already in use by another employee', 409);
    }
  }

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: input,
    select: {
      id: true,
      orgId: true,
      name: true,
      email: true,
      role: true,
      department: true,
      skills: true,
      walletAddress: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
};

/**
 * Delete an employee
 * Scoped by orgId to prevent cross-org deletion
 * Cascades to delete all their tasks
 * 
 * @param employeeId - Employee ID
 * @param orgId - Organization ID from JWT token
 * @throws AppError if employee not found
 */
export const deleteEmployee = async (
  employeeId: string,
  orgId: string
): Promise<void> => {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      orgId,
    },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  await prisma.employee.delete({
    where: { id: employeeId },
  });
};

/**
 * Get employee's productivity score
 * Scoped by orgId for security
 * 
 * @param employeeId - Employee ID
 * @param orgId - Organization ID from JWT token
 * @returns Productivity score with breakdown
 * @throws AppError if employee not found
 */
export const getEmployeeScore = async (
  employeeId: string,
  orgId: string
): Promise<ProductivityScore> => {
  const employee = await prisma.employee.findFirst({
    where: {
      id: employeeId,
      orgId,
    },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  return await calculateProductivityScore(employeeId, orgId);
};

/**
 * Get employee's own profile with tasks
 */
export const getMyProfile = async (employeeId: string, orgId: string) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, orgId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      skills: true,
      walletAddress: true,
      roleType: true,
      isActive: true,
      createdAt: true,
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          deadline: true,
          completedAt: true,
          txHash: true,
          createdAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  return employee;
};

/**
 * Get employee's own productivity score
 */
export const getMyScore = async (employeeId: string, orgId: string) => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, orgId },
    select: { id: true, name: true },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  const score = await calculateProductivityScore(employeeId, orgId);
  return { employeeId, employeeName: employee.name, ...score };
};
