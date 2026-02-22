/*
  Warnings:

  - Added the required column `department` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "department" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "skillRequired" TEXT;
