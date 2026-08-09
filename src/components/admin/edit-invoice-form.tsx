"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInvoice } from "@/actions/invoice";

type Item = { description: string; quantity: number; unitPrice: number };

export function EditInvoiceForm({
  invoiceId,
  initial,
}: {
  invoiceId: string;
  initial: { clientName: string; clientAddress: string; items: Item[] };
}) {
  const router = useRouter();
  const [clientName, setClientName] = useState(initial.clientName);
  const [clientAddress, setClientAddress] = useState(initial.clientAddress);
  const [items, setItems] = useState<Item[]>(initial.items);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateItem(index: number, patch: Partial<Item>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateInvoice(invoiceId, { clientName, clientAddress, items });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      router.push("/admin/factures");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <form onSubmit={handleSubmit} className="mt-1 space-y-3 text-sm">
        <label className="block">
          Client
          <input
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="block">
          Adresse (optionnel)
          <input
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>

        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_3rem_5rem_auto] gap-2">
              <input
                placeholder="Description"
                required
                value={item.description}
                onChange={(e) => updateItem(i, { description: e.target.value })}
                className="rounded-lg border border-ink/20 px-2 py-1.5"
              />
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                className="rounded-lg border border-ink/20 px-2 py-1.5"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Prix"
                value={item.unitPrice}
                onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })}
                className="rounded-lg border border-ink/20 px-2 py-1.5"
              />
              <button
                type="button"
                onClick={() => removeItem(i)}
                disabled={items.length <= 1}
                className="text-xs font-medium text-red-700 underline disabled:opacity-40"
              >
                Retirer
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0 }])}
            className="text-xs font-medium text-ink-light underline"
          >
            + Ajouter une ligne
          </button>
        </div>

        {error && <p className="text-xs font-medium text-red-700">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-full bg-ink px-4 py-2 font-semibold text-cream-50 disabled:opacity-60"
          >
            {isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/factures")}
            className="rounded-full border border-ink/20 px-4 py-2 font-semibold hover:bg-ink/5"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
