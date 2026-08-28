-- CreateTable
CREATE TABLE "ExpenseInvoice" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExpenseInvoice_expenseId_idx" ON "ExpenseInvoice"("expenseId");

-- AddForeignKey
ALTER TABLE "ExpenseInvoice" ADD CONSTRAINT "ExpenseInvoice_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

