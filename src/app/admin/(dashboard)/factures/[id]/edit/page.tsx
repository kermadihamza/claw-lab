import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditInvoiceForm } from "@/components/admin/edit-invoice-form";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { items: true },
  });

  if (!invoice) notFound();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Modifier la facture {invoice.number}</h1>
        <Link href="/admin/factures" className="text-sm text-ink-light underline">
          ← Retour
        </Link>
      </div>

      <div className="mt-6 max-w-lg">
        <EditInvoiceForm
          invoiceId={invoice.id}
          initial={{
            clientName: invoice.clientName,
            clientAddress: invoice.clientAddress ?? "",
            items: invoice.items.map((i) => ({
              description: i.description,
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
            })),
          }}
        />
      </div>
    </div>
  );
}
