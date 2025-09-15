/*
  Warnings:

  - You are about to drop the column `rssConfig` on the `Panel` table. All the data in the column will be lost.
  - You are about to drop the column `rssEnabled` on the `Panel` table. All the data in the column will be lost.
  - You are about to drop the column `weatherConfig` on the `Panel` table. All the data in the column will be lost.
  - You are about to drop the column `weatherEnabled` on the `Panel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Panel" DROP COLUMN "rssConfig",
DROP COLUMN "rssEnabled",
DROP COLUMN "weatherConfig",
DROP COLUMN "weatherEnabled",
ADD COLUMN     "customScreenContent" TEXT,
ADD COLUMN     "customScreenFrequency" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "lotteryFrequency" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "megaSenaFrequency" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "newsFrequency" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "showCustomScreen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showLottery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showMegaSena" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showNews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showWeather" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "weatherFrequency" INTEGER NOT NULL DEFAULT 2;
