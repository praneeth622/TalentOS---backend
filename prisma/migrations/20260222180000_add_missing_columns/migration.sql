-- Add missing columns that were in schema but not in init migration
ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "department" TEXT NOT NULL DEFAULT '';
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "skillRequired" TEXT;
