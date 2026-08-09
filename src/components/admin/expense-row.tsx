"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateExpense, deleteExpense } from "@/actions/expense";
import { formatDateShort, formatEUR } from "@/lib/format";

const CATEGORIES = [
  { value: "LOYER", label: "Loyer" },
  { value: "COTISATION", label: "Cotisation" },
  { value: "MATERIEL", label: "Matériel" },
  { value: "AUTRE", label: "Autre" },
];

const CATEGORY_LABELS: Record<string, string> = {
  LOYER: "Loyer",
  COTISATION: "Cotisation",
  MATERIEL: "Matériel",
  AUTRE: "Autre",
};

type Expense = {
  id: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  recurring: boolean;
};

function toDateInput(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ExpenseRow({ expense }: { expense: Expense }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    date: toDateInput(expense.date),
    category: expense.category,
    description: expense.description,
    amount: String(expense.amount),
    recurring: expense.recurring,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await updateExpense(expense.id, form);
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <tr className="border-t border-ink/10 bg-ink/[0.02]">
        <td className="px-4 py-2">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full rounded-lg border border-ink/20 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-2">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-ink/20 px-2 py-1 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2">
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-ink/20 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-24 rounded-lg border border-ink/20 px-2 py-1 text-sm"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream-50 disabled:opacity-60"
            >
              {isPending ? "..." : "Enregistrer"}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs font-medium underline">
              Annuler
            </button>
          </div>
          {error && <p className="mt-1 text-xs font-medium text-red-700">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-ink/10">
      <td className="px-4 py-3">{formatDateShort(expense.date)}</td>
      <td className="px-4 py-3">{CATEGORY_LABELS[expense.category]}</td>
      <td className="px-4 py-3">
        {expense.description}
        {expense.recurring && (
          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
            Récurrente
          </span>
        )}
      </td>
      <td className="px-4 py-3">{formatEUR(expense.amount)}</td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium underline">
            Modifier
          </button>
          <button
            type="button"
            onClick={() => startTransition(async () => {
              await deleteExpense(expense.id);
              router.refresh();
            })}
            className="text-xs font-medium text-red-700 underline"
          >
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  );
}
