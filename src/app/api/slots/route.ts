import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slots";
import { formatTime } from "@/lib/format";
import { deposeExtraMinutes, type DeposeChoice } from "@/lib/depose";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const serviceId = req.nextUrl.searchParams.get("serviceId");
  const deposeParam = req.nextUrl.searchParams.get("depose");
  const depose: DeposeChoice =
    deposeParam === "SALON" || deposeParam === "EXTERIEURE" ? deposeParam : "NONE";

  if (!date || !serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const slots = await getAvailableSlots(date, serviceId, deposeExtraMinutes(depose));

  return NextResponse.json({
    slots: slots.map((s) => ({
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
      label: formatTime(s.startTime),
    })),
  });
}
