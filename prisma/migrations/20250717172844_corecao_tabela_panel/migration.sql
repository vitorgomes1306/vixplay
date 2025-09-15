/*
  Warnings:

  - You are about to drop the column `megaSenaFrequency` on the `Panel` table. All the data in the column will be lost.
  - You are about to drop the column `showMegaSena` on the `Panel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Panel" DROP COLUMN "megaSenaFrequency",
DROP COLUMN "showMegaSena";
