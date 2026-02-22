import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';
import { RegisterInput, LoginInput, AuthResponse, JwtPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Register a new organization
 * Hashes password with bcrypt and creates org in database
 * 
 * @param input - Organization registration data (name, email, password)
 * @returns Auth response with JWT token and org data
 * @throws AppError if email already exists
 */
export const registerOrganization = async (input: RegisterInput): Promise<AuthResponse> => {
  const { name, email, password } = input;

  const existingOrg = await prisma.organization.findUnique({
    where: { email },
  });

  if (existingOrg) {
    throw new AppError('Organization with this email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const organization = await prisma.organization.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
    orgId: organization.id,
    email: organization.email,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    organization: {
      id: organization.id,
      name: organization.name,
      email: organization.email,
    },
  };
};

/**
 * Login an existing organization
 * Verifies password with bcrypt and generates JWT token
 * 
 * @param input - Login credentials (email, password)
 * @returns Auth response with JWT token and org data
 * @throws AppError if credentials are invalid
 */
export const loginOrganization = async (input: LoginInput): Promise<AuthResponse> => {
  const { email, password } = input;

  const organization = await prisma.organization.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      password: true,
    },
  });

  if (!organization) {
    throw new AppError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, organization.password);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
    orgId: organization.id,
    email: organization.email,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    organization: {
      id: organization.id,
      name: organization.name,
      email: organization.email,
    },
  };
};

/**
 * Verify and decode a JWT token
 * 
 * @param token - JWT token string
 * @returns Decoded JWT payload
 * @throws Error if token is invalid or expired
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

/**
 * Generate a random 12-character URL-safe password
 */
export function generatePassword(): string {
  return crypto.randomBytes(9).toString('base64url');
}

/**
 * Login an employee with email and password
 *
 * @param email - Employee email
 * @param password - Employee password
 * @returns Employee data and JWT token with employeeId + roleType
 */
export const loginEmployee = async (
  email: string,
  password: string
): Promise<{ employee: { id: string; name: string; email: string; role: string; department: string }; token: string }> => {
  const employee = await prisma.employee.findFirst({
    where: { email, isActive: true },
    select: {
      id: true,
      orgId: true,
      email: true,
      name: true,
      role: true,
      department: true,
      password: true,
      skills: true,
      walletAddress: true,
    },
  });

  if (!employee) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!employee.password) {
    throw new AppError('Account not configured. Contact your admin.', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, employee.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = jwt.sign(
    {
      orgId: employee.orgId,
      email: employee.email,
      employeeId: employee.id,
      roleType: 'EMPLOYEE',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
    },
    token,
  };
};

/**
 * Change an employee's password
 *
 * @param employeeId - Employee ID from JWT
 * @param orgId - Organization ID from JWT
 * @param currentPassword - Current password to verify
 * @param newPassword - New password to set
 * @returns Success message
 */
export const changePassword = async (
  employeeId: string,
  orgId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> => {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, orgId },
  });

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  if (!employee.password) {
    throw new AppError('No password set', 400);
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, employee.password);
  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 401);
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  await prisma.employee.update({
    where: { id: employeeId },
    data: { password: hashedNewPassword },
  });

  return { message: 'Password changed successfully' };
};
