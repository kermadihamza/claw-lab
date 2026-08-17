"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateBusinessHours } from "@/actions/settings";

const DAY_NAMES = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

type Hours = { dayOfWeek: number; isOpen: boolean; openTime: string | null; closeTime: string | null };

export function BusinessHoursForm({ hours }: { hours: Hours[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(
    ORDER.map((day) => {
      const existing = hours.find((h) => h.dayOfWeek === day);
      return {
        dayOfWeek: day,
        isOpen: existing?.isOpen ?? false,
        openTime: existing?.openTime ?? "09:00",
        closeTime: existing?.closeTime ?? "18:00",
      };
    })
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateRow(day: number, patch: Partial<(typeof rows)[number]>) {
    setRows((prev) => prev.map((r) => (r.dayOfWeek === day ? { ...r, ...patch } : r)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    startTransition(async () => {
      await Promise.all(rows.map((r) => updateBusinessHours(r)));
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <h2 className="font-display text-lg font-semibold">Horaires d&apos;ouverture</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.dayOfWeek} className="flex flex-wrap items-center gap-2 gap-y-1 sm:gap-3">
            <label className="flex w-full items-center gap-2 sm:w-32">
              <input
                type="checkbox"
                checked={row.isOpen}
                onChange={(e) => updateRow(row.dayOfWeek, { isOpen: e.target.checked })}
              />
              {DAY_NAMES[row.dayOfWeek]}
            </label>
            <input
              type="time"
              disabled={!row.isOpen}
              value={row.openTime ?? "09:00"}
              onChange={(e) => updateRow(row.dayOfWeek, { openTime: e.target.value })}
              className="rounded-lg border border-ink/20 px-2 py-1 disabled:opacity-40"
            />
            <span>-</span>
            <input
              type="time"
              disabled={!row.isOpen}
              value={row.closeTime ?? "18:00"}
              onChange={(e) => updateRow(row.dayOfWeek, { closeTime: e.target.value })}
              className="rounded-lg border border-ink/20 px-2 py-1 disabled:opacity-40"
            />
          </div>
        ))}
        {saved && <p className="text-xs font-medium text-green-700">Horaires enregistrés.</p>}
        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-full bg-ink px-5 py-2 font-semibold text-cream-50 disabled:opacity-60"
        >
          {isPending ? "Enregistrement..." : "Enregistrer les horaires"}
        </button>
      </form>
    </div>
  );
}
