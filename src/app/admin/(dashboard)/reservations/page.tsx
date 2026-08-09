import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateLong, formatTime } from "@/lib/format";
import { updateBookingStatus, deleteBlockedSlot } from "@/actions/booking";
import { NewManualBookingForm } from "@/components/admin/new-manual-booking-form";
import { BlockSlotForm } from "@/components/admin/block-slot-form";
import type { BookingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<BookingStatus, string> = {
  CONFIRMED: "Confirmé",
  COMPLETED: "Terminé",
  CANCELLED: "Annulé",
  NO_SHOW: "Absent",
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  CONFIRMED: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-gray-200 text-gray-700",
};

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(
    2,
    "0"
  )}`;
}

function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return toDateStr(date);
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const date = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date)
    ? searchParams.date
    : toDateStr(new Date());

  const [y, m, d] = date.split("-").map(Number);
  const dayStart = new Date(y, m - 1, d, 0, 0, 0);
  const dayEnd = new Date(y, m - 1, d + 1, 0, 0, 0);

  const [bookings, blockedSlots, services] = await Promise.all([
    prisma.booking.findMany({
      where: { startTime: { gte: dayStart, lt: dayEnd } },
      include: { service: true },
      orderBy: { startTime: "asc" },
    }),
    prisma.blockedSlot.findMany({
      where: { startTime: { gte: dayStart, lt: dayEnd } },
      orderBy: { startTime: "asc" },
    }),
    prisma.service.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Réservations</h1>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href={`/admin/reservations?date=${addDays(date, -1)}`}
          className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
        >
          ← Veille
        </Link>
        <p className="min-w-[16rem] text-center font-medium capitalize">
          {formatDateLong(dayStart)}
        </p>
        <Link
          href={`/admin/reservations?date=${addDays(date, 1)}`}
          className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
        >
          Lendemain →
        </Link>
        <Link
          href={`/admin/reservations?date=${toDateStr(new Date())}`}
          className="ml-2 text-sm text-ink-light underline"
        >
          Aujourd&apos;hui
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-ink/10">
            <table className="w-full text-sm">
              <thead className="bg-ink/5 text-left">
                <tr>
                  <th className="px-4 py-3">Heure</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Prestation</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-ink-light">
                      Aucun rendez-vous ce jour-là.
                    </td>
                  </tr>
                )}
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-ink/10">
                    <td className="px-4 py-3">
                      {formatTime(b.startTime)} - {formatTime(b.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/clients?client=${encodeURIComponent(b.clientEmail || b.clientPhone || b.clientName)}`} className="font-medium hover:underline">
                        {b.clientName}
                      </Link>
                      <p className="text-xs text-ink-light">{b.clientPhone || b.clientEmail}</p>
                      {b.notes && <p className="mt-0.5 text-xs italic text-ink-light">« {b.notes} »</p>}
                    </td>
                    <td className="px-4 py-3">{b.service.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/reservations/${b.id}/edit`} className="text-xs font-medium text-ink underline">
                          Modifier
                        </Link>
                        {b.status === "CONFIRMED" && (
                          <>
                            <form action={updateBookingStatus.bind(null, b.id, "COMPLETED")}>
                              <button className="text-xs font-medium text-green-700 underline">
                                Terminé
                              </button>
                            </form>
                            <form action={updateBookingStatus.bind(null, b.id, "NO_SHOW")}>
                              <button className="text-xs font-medium text-gray-600 underline">
                                Absent
                              </button>
                            </form>
                            <form action={updateBookingStatus.bind(null, b.id, "CANCELLED")}>
                              <button className="text-xs font-medium text-red-700 underline">
                                Annuler
                              </button>
                            </form>
                          </>
                        )}
                        {b.status !== "CONFIRMED" && (
                          <form action={updateBookingStatus.bind(null, b.id, "CONFIRMED")}>
                            <button className="text-xs font-medium text-blue-700 underline">
                              Réactiver
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {blockedSlots.length > 0 && (
            <div className="mt-6">
              <h2 className="font-display text-lg font-semibold">Blocages du jour</h2>
              <ul className="mt-2 space-y-2">
                {blockedSlots.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-ink/10 px-4 py-2 text-sm"
                  >
                    <span>
                      {formatTime(s.startTime)} - {formatTime(s.endTime)}
                      {s.reason ? ` — ${s.reason}` : ""}
                    </span>
                    <form action={deleteBlockedSlot.bind(null, s.id)}>
                      <button className="text-xs font-medium text-red-700 underline">Supprimer</button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <NewManualBookingForm services={services.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            durationMinutes: s.durationMinutes,
          }))} defaultDate={date} />
          <BlockSlotForm defaultDate={date} />
        </div>
      </div>
    </div>
  );
}
