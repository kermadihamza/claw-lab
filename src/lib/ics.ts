function escapeICSText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toICSDate(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function buildBookingICS(params: {
  uid: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Claw lab//Reservation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(params.start)}`,
    `DTEND:${toICSDate(params.end)}`,
    `SUMMARY:${escapeICSText(params.summary)}`,
    params.description ? `DESCRIPTION:${escapeICSText(params.description)}` : null,
    params.location ? `LOCATION:${escapeICSText(params.location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l != null);
  return lines.join("\r\n");
}
