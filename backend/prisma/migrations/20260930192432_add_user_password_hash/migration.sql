-- CreateEnum
CREATE TYPE "Roles" AS ENUM ('MEMBER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "roles" "Roles"[];
