import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

const CONFIRM_PHRASE = "RESET-PROD";

/**
 * Route temporaire à usage unique : vide les données transactionnelles (réservations, clients,
 * factures, dépenses, blocages) pour repartir sur une base propre après les tests. Garde la config
 * (prestations/tarifs, horaires, compte admin, paramètres). À supprimer après utilisation.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.RESET_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const dryRun = body?.dryRun !== false;

  const [bookings, invoiceCount, invoiceItemCount, expenseCount, blockedSlotCount] = await Promise.all([
    prisma.booking.findMany({ select: { id: true, googleEventId: true } }),
    prisma.invoice.count(),
    prisma.invoiceItem.count(),
    prisma.expense.count(),
    prisma.blockedSlot.count(),
  ]);

  const counts = {
    bookings: bookings.length,
    invoices: invoiceCount,
    invoiceItems: invoiceItemCount,
    expenses: expenseCount,
    blockedSlots: blockedSlotCount,
  };

  if (dryRun || body?.confirm !== CONFIRM_PHRASE) {
    return NextResponse.json({ ok: true, dryRun: true, counts });
  }

  let calendarEventsDeleted = 0;
  for (const booking of bookings) {
    if (booking.googleEventId) {
      await deleteCalendarEvent(booking.googleEventId);
      calendarEventsDeleted++;
    }
  }

  await prisma.$transaction([
    prisma.invoiceItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.expense.deleteMany(),
    prisma.blockedSlot.deleteMany(),
  ]);

  return NextResponse.json({ ok: true, dryRun: false, deleted: counts, calendarEventsDeleted });
}
