import { Request } from 'express';

/**
 * JWT token payload structure
 */
export interface JwtPayload {
  orgId: string;
  email: string;
  iat: number;
  exp: number;
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
