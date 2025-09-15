/*
  Warnings:

  - You are about to drop the column `format` on the `Panel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "format" "FormatDevice" NOT NULL DEFAULT 'HORIZONTAL';

-- AlterTable
ALTER TABLE "Panel" DROP COLUMN "format";
