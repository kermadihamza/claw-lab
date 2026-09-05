-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "tarifsImage" BYTEA,
ADD COLUMN     "tarifsImageMimeType" TEXT,
ADD COLUMN     "tarifsImageUpdatedAt" TIMESTAMPTZ(3);
