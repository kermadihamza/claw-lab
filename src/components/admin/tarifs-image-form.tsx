"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTarifsImage } from "@/actions/settings";
import { compressImage } from "@/lib/compress-image";

export function TarifsImageForm({ imageUrl }: { imageUrl: string | null }) {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function upload(fileList: FileList | File[]) {
    const file = Array.from(fileList)[0];
    if (!file) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append("image", compressed);
        const result = await updateTarifsImage(formData);
        if (!result.ok) {
          setError(result.error ?? "Erreur lors de l'envoi");
          return;
        }
        setSuccess(true);
        router.refresh();
      } catch {
        setError("Échec de l'envoi — réessaie avec une image moins lourde");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <h2 className="font-display text-lg font-semibold">Image de la page tarifs</h2>
      <p className="mt-1 text-sm text-ink-light">
        La photo de grille tarifaire affichée et téléchargeable sur la page publique « Tarifs ».
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-4">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="Image tarifs actuelle"
            className="h-28 w-20 shrink-0 rounded-lg border border-ink/10 object-cover shadow-sm"
          />
        )}

        <label
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
          className={`flex min-w-[200px] flex-1 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            isDragging ? "border-ink bg-ink/5" : "border-ink/20 hover:border-ink/40"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              if (e.target.files) upload(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="text-sm font-medium text-ink">
            {isPending ? "Envoi en cours..." : "Glisse une image ici, ou touche pour choisir"}
          </p>
          <p className="mt-1 text-xs text-ink-light">PNG, JPEG ou WEBP, 10 Mo max</p>
        </label>
      </div>

      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
      {success && <p className="mt-2 text-xs font-medium text-green-700">Image mise à jour.</p>}
    </div>
  );
}
