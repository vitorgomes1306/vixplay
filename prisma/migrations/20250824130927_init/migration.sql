/*
  Warnings:

  - You are about to drop the column `clientsId` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."FinancialStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."User" DROP CONSTRAINT "User_clientsId_fkey";

-- AlterTable
ALTER TABLE "public"."Panel" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "clientsId";

-- CreateTable
CREATE TABLE "public"."Campaign" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "clientId" INTEGER NOT NULL,
    "value" DECIMAL(10,2),
    "paymentMethod" TEXT,
    "dueDate" TIMESTAMP(3),
    "paymentStatus" TEXT DEFAULT 'PENDENTE',
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CampaignValue" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "campaignId" INTEGER NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FinancialTitle" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."FinancialStatus" NOT NULL DEFAULT 'PENDING',
    "pixCode" TEXT,
    "pixQrCode" TEXT,
    "pagseguroId" TEXT,
    "pagseguroStatus" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_UserClients" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserClients_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserClients_B_index" ON "public"."_UserClients"("B");

-- AddForeignKey
ALTER TABLE "public"."Campaign" ADD CONSTRAINT "Campaign_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CampaignValue" ADD CONSTRAINT "CampaignValue_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FinancialTitle" ADD CONSTRAINT "FinancialTitle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserClients" ADD CONSTRAINT "_UserClients_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserClients" ADD CONSTRAINT "_UserClients_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
