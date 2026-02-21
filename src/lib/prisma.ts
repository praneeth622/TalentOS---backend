import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton to avoid multiple instances
 * Import from here ONLY - never initialize PrismaClient elsewhere
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
