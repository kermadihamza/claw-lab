"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendReviewRequest } from "@/actions/booking";
import { formatDateShort } from "@/lib/format";

export function SendReviewButton({ bookingId, sentAt }: { bookingId: string; sentAt: Date | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (sentAt) {
    return <p className="text-xs text-ink-light">Avis demandé le {formatDateShort(sentAt)}</p>;
  }

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await sendReviewRequest(bookingId);
            if (!result.ok) {
              setError(result.error ?? "Erreur");
              return;
            }
            router.refresh();
          })
        }
        className="text-xs font-medium underline disabled:opacity-60"
      >
        {isPending ? "Envoi..." : "Demander un avis"}
      </button>
      {error && <p className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
