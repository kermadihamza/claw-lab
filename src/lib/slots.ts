import { addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import { TIMEZONE } from "@/lib/format";

const SLOT_STEP_MINUTES = 15;
const GEL_X_BUFFER_AFTER_MINUTES = 30;

export type Slot = {
  startTime: Date;
  endTime: Date;
};

function parseDateParts(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return { year, month, day };
}

/** Jour de la semaine (0=dimanche..6=samedi) pour une date calendaire, indépendant du fuseau. */
export function weekdayOf(dateStr: string): number {
  const { year, month, day } = parseDateParts(dateStr);
  return new Date(year, month - 1, day).getDay();
}

function zonedInstant(dateStr: string, hhmm: string): Date {
  return fromZonedTime(`${dateStr}T${hhmm}:00`, TIMEZONE);
}

export async function getAvailableSlots(dateStr: string, serviceId: string): Promise<Slot[]> {
  const [service, hours, settings] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId } }),
    prisma.businessHours.findUnique({ where: { dayOfWeek: weekdayOf(dateStr) } }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!service || !service.active) return [];
  if (!hours || !hours.isOpen || !hours.openTime || !hours.closeTime) return [];

  const bufferMinutes = settings?.bufferMinutes ?? 10;
  const dayStart = zonedInstant(dateStr, hours.openTime);
  const dayEnd = zonedInstant(dateStr, hours.closeTime);

  const [bookings, blocks] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: { startTime: true, endTime: true, service: { select: { category: true } } },
    }),
    prisma.blockedSlot.findMany({
      where: {
        startTime: { lt: dayEnd },
        endTime: { gt: dayStart },
      },
      select: { startTime: true, endTime: true },
    }),
  ]);

  const occupied = [
    ...bookings.map((b) => ({
      start: addMinutes(b.startTime, -bufferMinutes),
      end: addMinutes(
        b.endTime,
        b.service.category === "GEL_X" ? GEL_X_BUFFER_AFTER_MINUTES : bufferMinutes
      ),
    })),
    ...blocks.map((b) => ({ start: b.startTime, end: b.endTime })),
  ];

  const now = new Date();
  const slots: Slot[] = [];
  let cursor = dayStart;

  while (true) {
    const slotEnd = addMinutes(cursor, service.durationMinutes);
    if (slotEnd > dayEnd) break;

    const overlaps = occupied.some((o) => cursor < o.end && slotEnd > o.start);
    if (!overlaps && cursor > now) {
      slots.push({ startTime: cursor, endTime: slotEnd });
    }
    cursor = addMinutes(cursor, SLOT_STEP_MINUTES);
  }

  return slots;
}

/** Jours de la semaine ouverts (0=dimanche..6=samedi), pour piloter le calendrier côté client. */
export async function getOpenWeekdays(): Promise<number[]> {
  const allHours = await prisma.businessHours.findMany();
  return allHours.filter((h) => h.isOpen).map((h) => h.dayOfWeek);
}

/** Vérifie qu'un créneau est toujours disponible juste avant de créer la réservation (anti double-booking). */
export async function isSlotStillAvailable(
  serviceId: string,
  startTime: Date,
  endTime: Date
): Promise<boolean> {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const bufferMinutes = settings?.bufferMinutes ?? 10;
  const searchStart = addMinutes(startTime, -Math.max(bufferMinutes, GEL_X_BUFFER_AFTER_MINUTES));
  const searchEnd = addMinutes(endTime, Math.max(bufferMinutes, GEL_X_BUFFER_AFTER_MINUTES));

  const [nearbyBookings, conflictingBlock] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        startTime: { lt: searchEnd },
        endTime: { gt: searchStart },
      },
      select: { startTime: true, endTime: true, service: { select: { category: true } } },
    }),
    prisma.blockedSlot.findFirst({
      where: {
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    }),
  ]);

  const conflictingBooking = nearbyBookings.some((b) => {
    const occStart = addMinutes(b.startTime, -bufferMinutes);
    const occEnd = addMinutes(
      b.endTime,
      b.service.category === "GEL_X" ? GEL_X_BUFFER_AFTER_MINUTES : bufferMinutes
    );
    return startTime < occEnd && endTime > occStart;
  });

  return !conflictingBooking && !conflictingBlock;
}
