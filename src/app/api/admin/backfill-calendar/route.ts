import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEventForBooking, listCalendarEvents } from "@/lib/google-calendar";
import { deposeLabel } from "@/lib/depose";

export const dynamic = "force-dynamic";

/**
 * Route temporaire à usage unique : crée un événement Google Calendar pour chaque réservation
 * active qui n'en a pas (googleEventId manquant OU événement introuvable sur le vrai calendrier,
 * par ex. supprimé manuellement), pour rattraper d'anciennes réservations non synchronisées.
 * À supprimer après utilisation.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.RESET_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = body?.dryRun !== false;

  const allActive = await prisma.booking.findMany({
    where: { status: { not: "CANCELLED" } },
    include: { service: true },
    orderBy: { startTime: "asc" },
  });

  const withEventId = allActive.filter((b) => b.googleEventId);
  const idsOnCalendar = new Set<string>();
  if (withEventId.length > 0) {
    const timeMin = new Date(Math.min(...withEventId.map((b) => b.startTime.getTime())) - 24 * 60 * 60 * 1000);
    const timeMax = new Date(Math.max(...withEventId.map((b) => b.endTime.getTime())) + 24 * 60 * 60 * 1000);
    const events = await listCalendarEvents({ timeMin, timeMax });
    for (const e of events) {
      if (e.id && e.status !== "cancelled") idsOnCalendar.add(e.id);
    }
  }

  const bookings = allActive.filter((b) => !b.googleEventId || !idsOnCalendar.has(b.googleEventId));

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      count: bookings.length,
      bookings: bookings.map((b) => ({
        id: b.id,
        clientName: b.clientName,
        startTime: b.startTime,
        hadOrphanedId: !!b.googleEventId,
      })),
    });
  }

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const address = settings?.address ?? "16, rue des Capucins, 6700 Arlon";

  let created = 0;
  let failed = 0;
  const failedBookings: string[] = [];

  for (const booking of bookings) {
    const lines = [`Cliente : ${booking.clientName}`];
    if (booking.clientPhone) lines.push(`Téléphone : ${booking.clientPhone}`);
    if (booking.clientEmail) lines.push(`Email : ${booking.clientEmail}`);
    const depLabel = deposeLabel(booking.deposeType);
    if (depLabel) lines.push(depLabel);
    if (booking.notes) lines.push(`Notes : ${booking.notes}`);

    const googleEventId = await createCalendarEventForBooking({
      summary: `${booking.service.name} — ${booking.clientName}`,
      description: lines.join("\n"),
      location: address,
      start: booking.startTime,
      end: booking.endTime,
    });

    if (googleEventId) {
      await prisma.booking.update({ where: { id: booking.id }, data: { googleEventId } });
      created++;
    } else {
      failed++;
      failedBookings.push(booking.id);
    }
  }

  return NextResponse.json({ ok: true, dryRun: false, total: bookings.length, created, failed, failedBookings });
}
