import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTH_LABELS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseMonth(value: string | undefined): { year: number; month: number } {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [y, m] = value.split("-").map(Number);
    return { year: y, month: m - 1 };
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

function toMonthStr(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Grille du mois (lundi en premier), null pour les cases vides avant le 1er. */
function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  return cells;
}

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const { year, month } = parseMonth(searchParams.month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const [bookings, hours] = await Promise.all([
    prisma.booking.findMany({
      where: { startTime: { gte: monthStart, lt: monthEnd } },
      select: { startTime: true, status: true },
    }),
    prisma.businessHours.findMany(),
  ]);

  const openWeekdays = new Set(hours.filter((h) => h.isOpen).map((h) => h.dayOfWeek));

  const countsByDay = new Map<number, { active: number; cancelled: number }>();
  for (const b of bookings) {
    const day = b.startTime.getDate();
    const entry = countsByDay.get(day) ?? { active: 0, cancelled: 0 };
    if (b.status === "CANCELLED") entry.cancelled += 1;
    else entry.active += 1;
    countsByDay.set(day, entry);
  }

  const cells = buildMonthCells(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const prevMonth = month === 0 ? toMonthStr(year - 1, 11) : toMonthStr(year, month - 1);
  const nextMonth = month === 11 ? toMonthStr(year + 1, 0) : toMonthStr(year, month + 1);
  const thisMonth = toMonthStr(today.getFullYear(), today.getMonth());

  const totalActive = Array.from(countsByDay.values()).reduce((sum, c) => sum + c.active, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Calendrier</h1>
        <p className="text-sm text-ink-light">{totalActive} rendez-vous ce mois-ci</p>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Link
          href={`/admin/calendrier?month=${prevMonth}`}
          className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
        >
          ← Mois précédent
        </Link>
        <p className="min-w-[12rem] text-center font-medium">
          {MONTH_LABELS[month]} {year}
        </p>
        <Link
          href={`/admin/calendrier?month=${nextMonth}`}
          className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5"
        >
          Mois suivant →
        </Link>
        {!isCurrentMonth && (
          <Link href={`/admin/calendrier?month=${thisMonth}`} className="ml-2 text-sm text-ink-light underline">
            Aujourd&apos;hui
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((w) => (
          <p key={w} className="text-center text-xs font-semibold uppercase text-ink-light">
            {w}
          </p>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const dateStr = toDateStr(year, month, day);
          const weekday = new Date(year, month, day).getDay();
          const closed = !openWeekdays.has(weekday);
          const counts = countsByDay.get(day);
          const isToday = isCurrentMonth && today.getDate() === day;

          return (
            <Link
              key={dateStr}
              href={`/admin/reservations?date=${dateStr}`}
              className={`flex min-h-[4.5rem] flex-col rounded-lg border p-2 text-sm transition hover:border-ink/40 ${
                isToday ? "border-ink" : "border-ink/10"
              } ${closed ? "bg-ink/[0.02] text-ink-light/50" : "bg-white"}`}
            >
              <span className={`text-xs ${isToday ? "font-bold text-ink" : ""}`}>{day}</span>
              {counts && counts.active > 0 && (
                <span className="mt-auto self-start rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  {counts.active} RDV
                </span>
              )}
              {counts && counts.cancelled > 0 && counts.active === 0 && (
                <span className="mt-auto self-start rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  {counts.cancelled} annulé{counts.cancelled > 1 ? "s" : ""}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-ink-light">
        Cliquez sur un jour pour voir le détail des rendez-vous. Les jours grisés sont fermés.
      </p>
    </div>
  );
}
