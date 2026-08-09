import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateShort, formatEUR } from "@/lib/format";
import { generateInvoiceFromBookingForm, cancelInvoice } from "@/actions/invoice";
import { ManualInvoiceForm } from "@/components/admin/manual-invoice-form";

export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const currentYear = new Date().getFullYear();

  const [invoices, uninvoicedCompleted] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: [{ year: "desc" }, { sequence: "desc" }],
      take: 200,
    }),
    prisma.booking.findMany({
      where: { status: "COMPLETED", invoice: null },
      include: { service: true },
      orderBy: { startTime: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Factures</h1>
        <a
          href={`/api/factures/export?year=${currentYear}`}
          className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium hover:bg-ink/5"
        >
          Exporter {currentYear} (CSV)
        </a>
      </div>

      {uninvoicedCompleted.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <h2 className="font-display text-lg font-semibold text-amber-900">
            Rendez-vous terminés sans facture
          </h2>
          <ul className="mt-3 space-y-2">
            {uninvoicedCompleted.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm">
                <span>
                  {formatDateShort(b.startTime)} — {b.clientName} — {b.service.name}
                </span>
                <form action={generateInvoiceFromBookingForm.bind(null, b.id)}>
                  <button className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream-50">
                    Générer la facture
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-ink/10">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left">
              <tr>
                <th className="px-4 py-3">Numéro</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-light">
                    Aucune facture pour l&apos;instant.
                  </td>
                </tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-ink/10">
                  <td className="px-4 py-3 font-medium">{inv.number}</td>
                  <td className="px-4 py-3">{formatDateShort(inv.issueDate)}</td>
                  <td className="px-4 py-3">{inv.clientName}</td>
                  <td className="px-4 py-3">{formatEUR(inv.totalAmount as unknown as string)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        inv.status === "PAID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {inv.status === "PAID" ? "Payée" : "Annulée"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/api/factures/${inv.id}/pdf`}
                        target="_blank"
                        className="text-xs font-medium text-ink underline"
                      >
                        PDF
                      </Link>
                      {inv.status === "PAID" && (
                        <>
                          <Link
                            href={`/admin/factures/${inv.id}/edit`}
                            className="text-xs font-medium text-ink underline"
                          >
                            Modifier
                          </Link>
                          <form action={cancelInvoice.bind(null, inv.id)}>
                            <button className="text-xs font-medium text-red-700 underline">Annuler</button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ManualInvoiceForm />
      </div>
    </div>
  );
}
