-- CreateEnum
CREATE TYPE "DeposeType" AS ENUM ('NONE', 'SALON', 'EXTERIEURE');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "deposeType" "DeposeType" NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "isRemovalService" BOOLEAN NOT NULL DEFAULT false;
