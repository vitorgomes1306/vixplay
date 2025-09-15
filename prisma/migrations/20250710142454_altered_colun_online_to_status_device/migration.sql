/*
  Warnings:

  - You are about to drop the column `online` on the `Device` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Device" DROP COLUMN "online",
ADD COLUMN     "statusDevice" BOOLEAN NOT NULL DEFAULT false;
