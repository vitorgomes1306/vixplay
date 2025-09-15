/*
  Warnings:

  - The values [SPLIT_SCREEN] on the enum `PanelType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PanelType_new" AS ENUM ('FULL_SCREEN', 'DIVIDED');
ALTER TABLE "Panel" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Panel" ALTER COLUMN "type" TYPE "PanelType_new" USING ("type"::text::"PanelType_new");
ALTER TYPE "PanelType" RENAME TO "PanelType_old";
ALTER TYPE "PanelType_new" RENAME TO "PanelType";
DROP TYPE "PanelType_old";
ALTER TABLE "Panel" ALTER COLUMN "type" SET DEFAULT 'FULL_SCREEN';
COMMIT;
