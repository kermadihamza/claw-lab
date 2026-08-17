-- CreateEnum
CREATE TYPE "DeposeType" AS ENUM ('NONE', 'SALON', 'EXTERIEURE');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "deposeType" "DeposeType" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "isRemovalService" BOOLEAN NOT NULL DEFAULT false;

-- DataFix: flag the pre-existing standalone removal services
UPDATE "Service" SET "isRemovalService" = true WHERE name IN ('Dépose', 'Dépose extérieure');
