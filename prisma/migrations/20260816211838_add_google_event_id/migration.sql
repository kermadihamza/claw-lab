-- AlterTable
ALTER TABLE "BlockedSlot" ADD COLUMN     "googleEventId" TEXT;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "googleEventId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BlockedSlot_googleEventId_key" ON "BlockedSlot"("googleEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_googleEventId_key" ON "Booking"("googleEventId");
