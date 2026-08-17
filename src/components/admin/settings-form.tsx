"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/actions/settings";

type SettingsData = {
  businessName: string;
  address: string;
  tvaNumber: string | null;
  bceNumber: string | null;
  cotisationAmount: number | null;
  bufferMinutes: number;
  loyerMensuel: number;
};

export function SettingsForm({ settings }: { settings: SettingsData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: settings.businessName,
    address: settings.address,
    tvaNumber: settings.tvaNumber ?? "",
    bceNumber: settings.bceNumber ?? "",
    cotisationAmount: settings.cotisationAmount != null ? String(settings.cotisationAmount) : "",
    bufferMinutes: settings.bufferMinutes,
    loyerMensuel: settings.loyerMensuel,
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSettings(form);
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <h2 className="font-display text-lg font-semibold">Informations entreprise</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
        <label className="block">
          Nom commercial
          <input
            required
            value={form.businessName}
            onChange={(e) => setForm({ ...form, businessName: e.target.value })}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="block">
          Adresse
          <input
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            N° TVA
            <input
              placeholder="en attente"
              value={form.tvaNumber}
              onChange={(e) => setForm({ ...form, tvaNumber: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
            />
          </label>
          <label className="block">
            N° BCE
            <input
              placeholder="en attente"
              value={form.bceNumber}
              onChange={(e) => setForm({ ...form, bceNumber: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
            />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            Cotisation (€/trim.)
            <input
              type="number"
              step="0.01"
              placeholder="en attente"
              value={form.cotisationAmount}
              onChange={(e) => setForm({ ...form, cotisationAmount: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
            />
          </label>
          <label className="block">
            Loyer (€/mois)
            <input
              type="number"
              step="0.01"
              value={form.loyerMensuel}
              onChange={(e) => setForm({ ...form, loyerMensuel: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
            />
          </label>
          <label className="block">
            Battement (min)
            <input
              type="number"
              min={0}
              value={form.bufferMinutes}
              onChange={(e) => setForm({ ...form, bufferMinutes: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
            />
          </label>
        </div>
        {error && <p className="text-xs font-medium text-red-700">{error}</p>}
        {saved && <p className="text-xs font-medium text-green-700">Enregistré.</p>}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-ink px-5 py-2 font-semibold text-cream-50 disabled:opacity-60"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
