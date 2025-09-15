-- CreateEnum
CREATE TYPE "FormatDevice" AS ENUM ('HORIZONTAL', 'VERTICAL');

-- AlterTable
ALTER TABLE "Panel" ADD COLUMN     "format" "FormatDevice" NOT NULL DEFAULT 'HORIZONTAL';
