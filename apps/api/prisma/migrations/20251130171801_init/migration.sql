-- AlterTable
ALTER TABLE "audit_projects" ADD COLUMN     "excludedPaths" TEXT[] DEFAULT ARRAY[]::TEXT[];
