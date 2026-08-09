import { formatInTimeZone } from "date-fns-tz";

export const TIMEZONE = "Europe/Brussels";

/** Décompose une Date en {date, time} locaux (Europe/Brussels), pour pré-remplir un formulaire. */
export function splitDateTime(d: Date) {
  return {
    date: formatInTimeZone(d, TIMEZONE, "yyyy-MM-dd"),
    time: formatInTimeZone(d, TIMEZONE, "HH:mm"),
  };
}

export function formatEUR(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
}

export const DAY_NAMES = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

type HoursLike = { dayOfWeek: number; isOpen: boolean; openTime: string | null; closeTime: string | null };

/** Regroupe les jours ouverts consécutifs partageant les mêmes horaires, ex: "Lundi - Jeudi : 9h - 18h". */
export function summarizeBusinessHours(hours: HoursLike[]): { label: string; hours: string }[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  const sorted = order
    .map((d) => hours.find((h) => h.dayOfWeek === d))
    .filter((h): h is HoursLike => !!h);

  const groups: { days: number[]; openTime: string; closeTime: string }[] = [];
  for (const h of sorted) {
    if (!h.isOpen || !h.openTime || !h.closeTime) continue;
    const last = groups[groups.length - 1];
    if (
      last &&
      last.openTime === h.openTime &&
      last.closeTime === h.closeTime &&
      order.indexOf(last.days[last.days.length - 1]) === order.indexOf(h.dayOfWeek) - 1
    ) {
      last.days.push(h.dayOfWeek);
    } else {
      groups.push({ days: [h.dayOfWeek], openTime: h.openTime, closeTime: h.closeTime });
    }
  }

  return groups.map((g) => {
    const label =
      g.days.length > 1
        ? `${DAY_NAMES[g.days[0]]} - ${DAY_NAMES[g.days[g.days.length - 1]]}`
        : DAY_NAMES[g.days[0]];
    const openLabel = g.openTime.replace(":00", "h").replace(":", "h");
    const closeLabel = g.closeTime.replace(":00", "h").replace(":", "h");
    return { label, hours: `${openLabel} - ${closeLabel}` };
  });
}
