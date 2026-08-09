import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateShort, formatTime } from "@/lib/format";
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

type ClientBooking = {
  id: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  serviceName: string;
  notes: string | null;
};

type ClientGroup = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  bookings: ClientBooking[];
};

function clientKey(b: { clientEmail: string | null; clientPhone: string | null; clientName: string }) {
  return (b.clientEmail || b.clientPhone || b.clientName).trim().toLowerCase();
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { q?: string; client?: string };
}) {
  const bookings = await prisma.booking.findMany({
    include: { service: true },
    orderBy: { startTime: "desc" },
  });

  const groups = new Map<string, ClientGroup>();
  for (const b of bookings) {
    const key = clientKey(b);
    if (!groups.has(key)) {
      groups.set(key, { key, name: b.clientName, email: b.clientEmail, phone: b.clientPhone, bookings: [] });
    }
    groups.get(key)!.bookings.push({
      id: b.id,
      startTime: b.startTime,
      endTime: b.endTime,
      status: b.status,
      serviceName: b.service.name,
      notes: b.notes,
    });
  }

  let clients = Array.from(groups.values());
  clients.sort((a, b) => b.bookings[0].startTime.getTime() - a.bookings[0].startTime.getTime());

  const q = searchParams.q?.trim().toLowerCase();
  if (q) {
    clients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    );
  }

  const selectedKey = searchParams.client?.trim().toLowerCase();
  const selected = selectedKey ? clients.find((c) => c.key === selectedKey) : null;
  const qParam = searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : "";

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Clients</h1>
      <p className="mt-1 text-sm text-ink-light">{clients.length} client(e)s au total.</p>

      <form method="get" className="mt-6">
        <input
          type="search"
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Rechercher un nom, email ou téléphone..."
          className="w-full max-w-md rounded-lg border border-ink/20 px-3 py-2 text-sm"
        />
      </form>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-ink/10 lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="bg-ink/5 text-left">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">RDV actifs</th>
                <th className="px-4 py-3">Annulés</th>
                <th className="px-4 py-3">Dernière visite</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-light">
                    Aucun client trouvé.
                  </td>
                </tr>
              )}
              {clients.map((c) => {
                const active = c.bookings.filter((b) => b.status !== "CANCELLED").length;
                const cancelled = c.bookings.filter((b) => b.status === "CANCELLED").length;
                return (
                  <tr
                    key={c.key}
                    className={`border-t border-ink/10 ${selected?.key === c.key ? "bg-ink/5" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-ink-light">{c.email || c.phone || "—"}</td>
                    <td className="px-4 py-3">{active}</td>
                    <td className="px-4 py-3">
                      {cancelled > 0 ? <span className="text-red-700">{cancelled}</span> : "0"}
                    </td>
                    <td className="px-4 py-3">{formatDateShort(c.bookings[0].startTime)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/clients?client=${encodeURIComponent(c.key)}${qParam}`}
                        className="text-xs font-medium underline"
                      >
                        Historique
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          {selected ? (
            <div className="rounded-2xl border border-ink/10 p-5">
              <h2 className="font-display text-lg font-semibold">{selected.name}</h2>
              {selected.email && <p className="text-sm text-ink-light">{selected.email}</p>}
              {selected.phone && <p className="text-sm text-ink-light">{selected.phone}</p>}
              <ul className="mt-4 space-y-3 divide-y divide-ink/10 text-sm">
                {selected.bookings.map((b) => (
                  <li key={b.id} className="pt-3 first:pt-0">
                    <p className="font-medium">
                      {formatDateShort(b.startTime)} à {formatTime(b.startTime)}
                    </p>
                    <p className="text-ink-light">{b.serviceName}</p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}
                    >
                      {STATUS_LABELS[b.status]}
                    </span>
                    {b.notes && <p className="mt-1 text-xs italic text-ink-light">« {b.notes} »</p>}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-2xl border border-ink/10 p-5 text-sm text-ink-light">
              Cliquez sur &quot;Historique&quot; pour voir toutes les visites d&apos;un(e) client(e).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
