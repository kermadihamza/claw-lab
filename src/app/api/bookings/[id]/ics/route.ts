import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildBookingICS } from "@/lib/ics";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { service: true },
  });
  if (!booking) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });

  const ics = buildBookingICS({
    uid: `${booking.id}@clawlab.be`,
    summary: `${booking.service.name} — Claw lab`,
    description: `Client : ${booking.clientName}\nTéléphone : ${booking.clientPhone ?? "-"}\nEmail : ${
      booking.clientEmail ?? "-"
    }`,
    location: settings?.address ?? "16, rue des Capucins, 6700 Arlon",
    start: booking.startTime,
    end: booking.endTime,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="rdv-clawlab.ics"`,
    },
  });
}
