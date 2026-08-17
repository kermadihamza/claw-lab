import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { splitDateTime } from "@/lib/format";
import { EditBookingForm } from "@/components/admin/edit-booking-form";

export default async function EditBookingPage({ params }: { params: { id: string } }) {
  const [booking, services] = await Promise.all([
    prisma.booking.findUnique({ where: { id: params.id } }),
    prisma.service.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
  ]);

  if (!booking) notFound();

  const { date, time } = splitDateTime(booking.startTime);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Modifier le rendez-vous</h1>
        <Link href={`/admin/reservations?date=${date}`} className="text-sm text-ink-light underline">
          ← Retour
        </Link>
      </div>

      <div className="mt-6 max-w-md">
        <EditBookingForm
          bookingId={booking.id}
          services={services.map((s) => ({
            id: s.id,
            name: s.name,
            category: s.category,
            durationMinutes: s.durationMinutes,
            isRemovalService: s.isRemovalService,
          }))}
          initial={{
            serviceId: booking.serviceId,
            date,
            time,
            clientName: booking.clientName,
            clientPhone: booking.clientPhone ?? "",
            clientEmail: booking.clientEmail ?? "",
            notes: booking.notes ?? "",
            depose: booking.deposeType,
          }}
        />
      </div>
    </div>
  );
}
