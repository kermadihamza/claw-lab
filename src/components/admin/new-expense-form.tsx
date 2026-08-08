"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/actions/expense";

const CATEGORIES = [
  { value: "LOYER", label: "Loyer" },
  { value: "COTISATION", label: "Cotisation sociale" },
  { value: "MATERIEL", label: "Matériel" },
  { value: "AUTRE", label: "Autre" },
];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NewExpenseForm({ defaultAmount }: { defaultAmount?: number }) {
  const router = useRouter();
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState("AUTRE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<string>(defaultAmount ? String(defaultAmount) : "");
  const [recurring, setRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createExpense({ date, category, description, amount, recurring });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setDescription("");
      setAmount("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <h2 className="font-display text-lg font-semibold">Ajouter une dépense</h2>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
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
            Catégorie
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          Description
          <input
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="block">
          Montant (€)
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
          Dépense récurrente (mensuelle)
        </label>
        {error && <p className="text-xs font-medium text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-full bg-ink px-4 py-2 font-semibold text-cream-50 disabled:opacity-60"
        >
          {isPending ? "Ajout..." : "Ajouter la dépense"}
        </button>
      </form>
    </div>
  );
}
