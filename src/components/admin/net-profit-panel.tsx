"use client";

import { useState } from "react";
import { formatEUR } from "@/lib/format";

export function NetProfitPanel({ year, revenue, expenses }: { year: number; revenue: number; expenses: number }) {
  const [open, setOpen] = useState(false);
  const net = revenue - expenses;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium hover:bg-ink/5"
      >
        {open ? "Masquer le bénéfice net" : "Voir le bénéfice net"}
      </button>
      {open && (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 border-l-4 border-l-green-500 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-light">Gains {year}</p>
            <p className="mt-1 font-display text-xl font-semibold">{formatEUR(revenue)}</p>
          </div>
          <div className="rounded-2xl border border-ink/10 border-l-4 border-l-red-400 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-light">Dépenses {year}</p>
            <p className="mt-1 font-display text-xl font-semibold">{formatEUR(expenses)}</p>
          </div>
          <div
            className={`rounded-2xl border border-ink/10 border-l-4 bg-white p-4 ${net >= 0 ? "border-l-green-500" : "border-l-red-400"}`}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-ink-light">Bénéfice net {year}</p>
            <p className={`mt-1 font-display text-xl font-semibold ${net >= 0 ? "text-green-700" : "text-red-700"}`}>
              {formatEUR(net)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
