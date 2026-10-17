"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/actions/expense";
import { uploadExpenseInvoices } from "@/actions/expense-invoice";
import { compressImage } from "@/lib/compress-image";

const CATEGORIES = [
  { value: "LOYER", label: "Loyer" },
  { value: "COTISATION", label: "Cotisation sociale" },
  { value: "MATERIEL", label: "Matériel" },
  { value: "MARKETING", label: "Marketing" },
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
  const [files, setFiles] = useState<File[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  // Compresse tout de suite à la sélection : sur Safari iOS, un fichier venant d'un <input>
  // devient invalide s'il traîne en mémoire sans être lu avant la soumission du formulaire.
  async function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    setIsCompressing(true);
    try {
      const compressed = await Promise.all(incoming.map(compressImage));
      setFiles((prev) => [...prev, ...compressed]);
    } finally {
      setIsCompressing(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createExpense({ date, category, description, amount, recurring });
      if (!result.ok) {
        setError(result.error ?? "Erreur");
        return;
      }
      if (files.length > 0) {
        try {
          const formData = new FormData();
          for (const file of files) formData.append("files", file);
          const uploadResult = await uploadExpenseInvoices(result.id, formData);
          if (!uploadResult.ok) {
            setError(`Dépense ajoutée, mais ${uploadResult.error?.toLowerCase() ?? "l'envoi des fichiers a échoué"}`);
          }
        } catch {
          setError("Dépense ajoutée, mais l'envoi des fichiers a échoué — réessaie avec une photo moins lourde");
        }
      }
      setDescription("");
      setAmount("");
      setFiles([]);
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

        <div>
          <span className="block text-sm">Facture (optionnel)</span>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors ${
              isDragging ? "border-ink bg-ink/5" : "border-ink/20 hover:border-ink/40"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="application/pdf,image/*"
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-ink-light">
              {isCompressing ? "Traitement..." : "Glisse une facture ici, ou touche pour choisir (PDF/image, 10 Mo max)"}
            </p>
          </label>
          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((file, i) => (
                <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    className="shrink-0 font-medium text-red-700 underline"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

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
