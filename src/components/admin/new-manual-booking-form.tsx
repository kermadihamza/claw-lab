"use client";

import { useState, useTransition } from "react";
import { fromZonedTime } from "date-fns-tz";
import { addMinutes } from "date-fns";
import { useRouter } from "next/navigation";
import { createManualBooking } from "@/actions/booking";
import { deposeExtraMinutes, type DeposeChoice } from "@/lib/depose";

type ServiceOption = { id: string; name: string; category: string; durationMinutes: number; isRemovalService: boolean };

const DEPOSE_OPTIONS: { value: DeposeChoice; label: string }[] = [
  { value: "NONE", label: "Non, ongles nus" },
  { value: "SALON", label: "Oui, posée chez Claw lab (offerte)" },
  { value: "EXTERIEURE", label: "Oui, posée ailleurs (+15€)" },
];

export function NewManualBookingForm({
  services,
  defaultDate,
}: {
  services: ServiceOption[];
  defaultDate: string;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("09:00");
  const [depose, setDepose] = useState<DeposeChoice>("NONE");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
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
      const result = await createManualBooking({
        serviceId,
        date,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        clientName,
        clientPhone,
        clientEmail,
        depose: effectiveDepose,
      });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setClientName("");
      setClientPhone("");
      setClientEmail("");
      setDepose("NONE");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <h2 className="font-display text-lg font-semibold">Nouveau rendez-vous manuel</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
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
                    name="depose"
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
        {error && <p className="text-xs font-medium text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-ink px-4 py-2 font-semibold text-cream-50 disabled:opacity-60"
        >
          {isPending ? "Ajout..." : "Ajouter le rendez-vous"}
        </button>
      </form>
    </div>
  );
}
