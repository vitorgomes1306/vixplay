/*
  Warnings:

  - The values [TOTEN] on the enum `DeviceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeviceType_new" AS ENUM ('TV', 'MONITOR', 'TABLET', 'TOTEM');
ALTER TABLE "Device" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Device" ALTER COLUMN "type" TYPE "DeviceType_new" USING ("type"::text::"DeviceType_new");
ALTER TYPE "DeviceType" RENAME TO "DeviceType_old";
ALTER TYPE "DeviceType_new" RENAME TO "DeviceType";
DROP TYPE "DeviceType_old";
ALTER TABLE "Device" ALTER COLUMN "type" SET DEFAULT 'TV';
COMMIT;
