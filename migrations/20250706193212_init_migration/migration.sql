/*
  Warnings:

  - You are about to drop the column `lastseen` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `lastseenat` on the `Device` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Device` table without a default value. This is not possible if the table is not empty.
  - Made the column `url` on table `Media` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Device" DROP COLUMN "lastseen",
DROP COLUMN "lastseenat",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Media" ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "url" SET NOT NULL;

-- AlterTable
ALTER TABLE "Panel" ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "Active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bloqued" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "picture" TEXT;

-- CreateTable
CREATE TABLE "wifiUsers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "lastAccess" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wifiUsers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wifiUsers_email_key" ON "wifiUsers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wifiUsers_cpf_key" ON "wifiUsers"("cpf");
