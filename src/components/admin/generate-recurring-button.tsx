"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateRecurringExpenses } from "@/actions/expense";

export function GenerateRecurringButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const { created } = await generateRecurringExpenses();
      setMessage(
        created === 0
          ? "Déjà généré pour ce mois-ci."
          : `${created} dépense${created > 1 ? "s" : ""} récurrente${created > 1 ? "s" : ""} ajoutée${created > 1 ? "s" : ""}.`
      );
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium hover:bg-ink/5 disabled:opacity-60"
      >
        {isPending ? "Génération..." : "Générer les récurrentes de ce mois"}
      </button>
      {message && <p className="text-xs text-ink-light">{message}</p>}
    </div>
  );
}
