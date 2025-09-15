-- AlterTable
ALTER TABLE "Panel" ADD COLUMN     "layout" JSONB,
ADD COLUMN     "rssConfig" JSONB,
ADD COLUMN     "rssEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weatherConfig" JSONB,
ADD COLUMN     "weatherEnabled" BOOLEAN NOT NULL DEFAULT false;
