"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadExpenseInvoices, deleteExpenseInvoice } from "@/actions/expense-invoice";

type InvoiceFile = { id: string; filename: string; mimeType: string; size: number };

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function ExpenseInvoiceDropzone({ expenseId, invoices }: { expenseId: string; invoices: InvoiceFile[] }) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setError(null);
    const formData = new FormData();
    for (const file of files) formData.append("files", file);
    startTransition(async () => {
      const result = await uploadExpenseInvoices(expenseId, formData);
      if (!result.ok) {
        setError(result.error ?? "Erreur lors de l'envoi");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
          isDragging ? "border-ink bg-ink/5" : "border-ink/20 hover:border-ink/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="text-sm font-medium text-ink">
          {isPending ? "Envoi en cours..." : "Glisse une facture ici, ou clique pour choisir un fichier"}
        </p>
        <p className="mt-1 text-xs text-ink-light">PDF ou image, 10 Mo max par fichier</p>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}

      {invoices.length > 0 && (
        <ul className="mt-3 space-y-2">
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-ink/10 bg-cream-50 px-3 py-2 text-sm"
            >
              <a
                href={`/api/depenses/invoices/${inv.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate font-medium underline"
              >
                {inv.filename}
              </a>
              <span className="shrink-0 text-xs text-ink-light">{formatSize(inv.size)}</span>
              <button
                type="button"
                onClick={() =>
                  startTransition(async () => {
                    await deleteExpenseInvoice(inv.id);
                    router.refresh();
                  })
                }
                className="shrink-0 text-xs font-medium text-red-700 underline"
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
