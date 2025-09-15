/*
  Warnings:

  - You are about to drop the column `title` on the `Panel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Panel" DROP COLUMN "title",
ADD COLUMN     "description" TEXT;
