import { Fragment } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateShort, formatEUR } from "@/lib/format";
import { generateInvoiceFromBookingForm, cancelInvoice } from "@/actions/invoice";
import { ManualInvoiceForm } from "@/components/admin/manual-invoice-form";
import { SendReviewButton } from "@/components/admin/send-review-button";
import { deposeSurcharge, deposeLabel } from "@/lib/depose";

export const dynamic = "force-dynamic";

export default async function FacturesPage() {
  const currentYear = new Date().getFullYear();

  const [invoices, uninvoicedCompleted] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: [{ year: "desc" }, { sequence: "desc" }],
      take: 200,
      include: {
        booking: { select: { id: true, clientEmail: true, reviewRequestSentAt: true } },
      },
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
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <p className="mt-1 text-xs text-amber-800">
            Le prix est pré-rempli avec le tarif de la prestation — modifie-le si besoin (promo, remise duo...) avant de générer la facture.
          </p>
          <ul className="mt-3 space-y-2">
            {uninvoicedCompleted.map((b) => {
              const label = deposeLabel(b.deposeType);
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <span>
                    {formatDateShort(b.startTime)} — {b.clientName} — {b.service.name}
                    {label && <span className="ml-2 text-xs font-medium text-slate-600">({label})</span>}
                  </span>
                  <form action={generateInvoiceFromBookingForm.bind(null, b.id)} className="flex shrink-0 items-center gap-2">
                    <input
                      type="number"
                      name="price"
                      step="0.01"
                      min="0"
                      defaultValue={Number(b.service.priceMin) + deposeSurcharge(b.deposeType)}
                      className="w-20 rounded-lg border border-ink/20 px-2 py-1 text-xs"
                    />
                    <button className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream-50">
                      Générer la facture
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="min-w-0 overflow-x-auto rounded-2xl border border-ink/10 lg:col-span-2">
          <table className="w-full sm:min-w-[640px] text-sm">
            <thead className="hidden bg-ink/5 text-left sm:table-header-group">
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
              {invoices.map((inv) => {
                const statusBadge = (
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      inv.status === "PAID" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {inv.status === "PAID" ? "Payée" : "Annulée"}
                  </span>
                );
                const actions = (
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/api/factures/${inv.id}/pdf`}
                      target="_blank"
                      className="text-xs font-medium text-ink underline"
                    >
                      PDF
                    </Link>
                    {inv.booking?.clientEmail && (
                      <SendReviewButton
                        bookingId={inv.booking.id}
                        sentAt={inv.booking.reviewRequestSentAt}
                      />
                    )}
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
                );
                return (
                  <Fragment key={inv.id}>
                    {/* Carte mobile */}
                    <tr className="border-t border-ink/10 sm:hidden">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium">{inv.number}</p>
                            <p className="text-xs text-ink-light">
                              {formatDateShort(inv.issueDate)} · {inv.clientName}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-display text-base font-semibold">
                              {formatEUR(inv.totalAmount as unknown as string)}
                            </p>
                            <div className="mt-1">{statusBadge}</div>
                          </div>
                        </div>
                        <div className="mt-3">{actions}</div>
                      </td>
                    </tr>

                    {/* Ligne desktop */}
                    <tr className="hidden border-t border-ink/10 sm:table-row">
                      <td className="px-4 py-3 font-medium">{inv.number}</td>
                      <td className="px-4 py-3">{formatDateShort(inv.issueDate)}</td>
                      <td className="px-4 py-3">{inv.clientName}</td>
                      <td className="px-4 py-3">{formatEUR(inv.totalAmount as unknown as string)}</td>
                      <td className="px-4 py-3">{statusBadge}</td>
                      <td className="px-4 py-3">{actions}</td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <ManualInvoiceForm />
      </div>
    </div>
  );
}
