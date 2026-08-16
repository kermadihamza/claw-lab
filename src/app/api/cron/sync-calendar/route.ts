import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listCalendarEvents, isAppCreatedEvent } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

const WINDOW_PAST_DAYS = 1;
const WINDOW_FUTURE_DAYS = 120;

/**
 * Synchronise les événements ajoutés/modifiés/supprimés manuellement dans Google Calendar
 * vers des BlockedSlot. Les événements créés par l'app (tag extendedProperties) sont ignorés
 * car ils sont déjà suivis via Booking.googleEventId.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const timeMin = new Date(now.getTime() - WINDOW_PAST_DAYS * 24 * 60 * 60 * 1000);
  const timeMax = new Date(now.getTime() + WINDOW_FUTURE_DAYS * 24 * 60 * 60 * 1000);

  const events = await listCalendarEvents({ timeMin, timeMax });

  const manualEvents = events.filter(
    (e) => e.status !== "cancelled" && !isAppCreatedEvent(e) && e.start?.dateTime && e.end?.dateTime && e.id
  );

  let created = 0;
  let updated = 0;
  let deleted = 0;

  const seenEventIds = new Set<string>();

  for (const event of manualEvents) {
    const eventId = event.id as string;
    seenEventIds.add(eventId);
    const startTime = new Date(event.start!.dateTime as string);
    const endTime = new Date(event.end!.dateTime as string);
    const reason = event.summary || "Bloqué depuis Google Calendar";

    const existing = await prisma.blockedSlot.findUnique({ where: { googleEventId: eventId } });
    if (!existing) {
      await prisma.blockedSlot.create({ data: { startTime, endTime, reason, googleEventId: eventId } });
      created++;
    } else if (
      existing.startTime.getTime() !== startTime.getTime() ||
      existing.endTime.getTime() !== endTime.getTime() ||
      existing.reason !== reason
    ) {
      await prisma.blockedSlot.update({ where: { id: existing.id }, data: { startTime, endTime, reason } });
      updated++;
    }
  }

  const trackedSlots = await prisma.blockedSlot.findMany({
    where: {
      googleEventId: { not: null },
      startTime: { gte: timeMin, lte: timeMax },
    },
  });
  for (const slot of trackedSlots) {
    if (slot.googleEventId && !seenEventIds.has(slot.googleEventId)) {
      await prisma.blockedSlot.delete({ where: { id: slot.id } });
      deleted++;
    }
  }

  return NextResponse.json({ ok: true, created, updated, deleted, scanned: manualEvents.length });
}
