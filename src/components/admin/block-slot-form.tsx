"use client";

import { useState, useTransition } from "react";
import { fromZonedTime } from "date-fns-tz";
import { useRouter } from "next/navigation";
import { createBlockedSlot } from "@/actions/booking";

export function BlockSlotForm({ defaultDate }: { defaultDate: string }) {
  const router = useRouter();
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const start = fromZonedTime(`${date}T${startTime}:00`, "Europe/Brussels");
    const end = fromZonedTime(`${date}T${endTime}:00`, "Europe/Brussels");

    startTransition(async () => {
      const result = await createBlockedSlot({
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        reason,
      });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <h2 className="font-display text-lg font-semibold">Bloquer un créneau</h2>
      <p className="mt-1 text-xs text-ink-light">Congés, jour férié, imprévu...</p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
        <label className="block">
          Date
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            Début
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
            />
          </label>
          <label className="block">
            Fin
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
            />
          </label>
        </div>
        <label className="block">
          Raison (optionnel)
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        {error && <p className="text-xs font-medium text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full border border-ink px-4 py-2 font-semibold text-ink disabled:opacity-60"
        >
          {isPending ? "Ajout..." : "Bloquer ce créneau"}
        </button>
      </form>
    </div>
  );
}
