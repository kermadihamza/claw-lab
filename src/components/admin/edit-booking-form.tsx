"use client";

import { useState, useTransition } from "react";
import { fromZonedTime } from "date-fns-tz";
import { addMinutes } from "date-fns";
import { useRouter } from "next/navigation";
import { updateBooking } from "@/actions/booking";
import { deposeExtraMinutes, type DeposeChoice } from "@/lib/depose";

type ServiceOption = { id: string; name: string; category: string; durationMinutes: number; isRemovalService: boolean };

const DEPOSE_OPTIONS: { value: DeposeChoice; label: string }[] = [
  { value: "NONE", label: "Non, ongles nus" },
  { value: "SALON", label: "Oui, posée chez Claw lab (offerte)" },
  { value: "EXTERIEURE", label: "Oui, posée ailleurs (+15€)" },
];

export function EditBookingForm({
  bookingId,
  services,
  initial,
}: {
  bookingId: string;
  services: ServiceOption[];
  initial: {
    serviceId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    notes: string;
    depose: DeposeChoice;
  };
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(initial.serviceId);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [depose, setDepose] = useState<DeposeChoice>(initial.depose);
  const [clientName, setClientName] = useState(initial.clientName);
  const [clientPhone, setClientPhone] = useState(initial.clientPhone);
  const [clientEmail, setClientEmail] = useState(initial.clientEmail);
  const [notes, setNotes] = useState(initial.notes);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const service = services.find((s) => s.id === serviceId);
  const showDepose = service && !service.isRemovalService;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service) return;
    setError(null);
    const effectiveDepose = service.isRemovalService ? "NONE" : depose;
    const start = fromZonedTime(`${date}T${time}:00`, "Europe/Brussels");
    const end = addMinutes(start, service.durationMinutes + deposeExtraMinutes(effectiveDepose));

    startTransition(async () => {
      const result = await updateBooking(bookingId, {
        serviceId,
        date,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        clientName,
        clientPhone,
        clientEmail,
        notes,
        depose: effectiveDepose,
      });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      router.push(`/admin/reservations?date=${date}`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <form onSubmit={handleSubmit} className="mt-1 space-y-3 text-sm">
        <label className="block">
          Prestation
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.durationMinutes} min)
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <label className="block">
            Heure
            <input
              type="time"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
            />
          </label>
        </div>
        {showDepose && (
          <div className="rounded-lg border border-ink/10 bg-ink/[0.02] p-3">
            <p className="text-xs font-medium text-ink">A-t-elle actuellement une pose sur les ongles ?</p>
            <div className="mt-2 space-y-1.5">
              {DEPOSE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name="depose-edit"
                    checked={depose === opt.value}
                    onChange={() => setDepose(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        )}
        <label className="block">
          Nom du client
          <input
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="block">
          Téléphone (optionnel)
          <input
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="block">
          Email (optionnel)
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="block">
          Remarques (optionnel)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        {error && <p className="text-xs font-medium text-red-700">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-full bg-ink px-4 py-2 font-semibold text-cream-50 disabled:opacity-60"
          >
            {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/admin/reservations?date=${initial.date}`)}
            className="rounded-full border border-ink/20 px-4 py-2 font-semibold hover:bg-ink/5"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
