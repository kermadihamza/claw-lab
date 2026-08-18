import { NextRequest, NextResponse } from "next/server";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { sendBookingReminderEmail } from "@/lib/mail";
import { TIMEZONE } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Envoie un rappel par email la veille de chaque rendez-vous confirmé, pour réduire les absences. */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const tomorrowDateStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const dayAfterDateStr = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const rangeStart = fromZonedTime(`${tomorrowDateStr}T00:00:00`, TIMEZONE);
  const rangeEnd = fromZonedTime(`${dayAfterDateStr}T00:00:00`, TIMEZONE);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      startTime: { gte: rangeStart, lt: rangeEnd },
      clientEmail: { not: null },
      reminderSentAt: null,
    },
    include: { service: true },
  });

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const address = settings?.address ?? "16, rue des Capucins, 6700 Arlon";

  let sent = 0;
  for (const booking of bookings) {
    try {
      await sendBookingReminderEmail({
        bookingId: booking.id,
        to: booking.clientEmail as string,
        clientName: booking.clientName,
        serviceName: booking.service.name,
        startTime: booking.startTime,
        endTime: booking.endTime,
        address,
      });
      await prisma.booking.update({ where: { id: booking.id }, data: { reminderSentAt: new Date() } });
      sent++;
    } catch (err) {
      console.error(`Échec de l'envoi du rappel pour la réservation ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, scanned: bookings.length, sent });
}
