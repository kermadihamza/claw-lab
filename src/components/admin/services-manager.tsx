"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertService, toggleServiceActive, moveService } from "@/actions/settings";

type ServiceData = {
  id: string;
  category: string;
  name: string;
  priceMin: number;
  priceMax: number | null;
  durationMinutes: number;
  active: boolean;
  sortOrder: number;
};

const CATEGORIES = [
  { value: "VERNIS_SEMI_PERMANENT", label: "Vernis semi-permanent" },
  { value: "MANUCURE", label: "Manucure" },
  { value: "GAINAGE", label: "Gainage" },
  { value: "GEL_X", label: "Gel X" },
];

function ServiceRow({
  service,
  isFirst,
  isLast,
}: {
  service: ServiceData;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: service.name,
    priceMin: service.priceMin,
    priceMax: service.priceMax ?? "",
    durationMinutes: service.durationMinutes,
  });
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await upsertService({
        id: service.id,
        category: service.category,
        name: form.name,
        priceMin: form.priceMin,
        priceMax: form.priceMax,
        durationMinutes: form.durationMinutes,
        active: service.active,
        sortOrder: service.sortOrder,
      });
      router.refresh();
    });
  }

  function move(direction: "up" | "down") {
    startTransition(async () => {
      await moveService(service.id, direction);
      router.refresh();
    });
  }

  return (
    <div className="grid grid-cols-[2.5rem_1fr_5rem_5rem_5rem_auto_auto] items-center gap-2 border-t border-ink/10 py-2 text-sm">
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => move("up")}
          disabled={isFirst || isPending}
          aria-label="Monter"
          className="leading-none text-ink-light hover:text-ink disabled:opacity-30"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => move("down")}
          disabled={isLast || isPending}
          aria-label="Descendre"
          className="leading-none text-ink-light hover:text-ink disabled:opacity-30"
        >
          ▼
        </button>
      </div>
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="rounded-lg border border-ink/20 px-2 py-1"
      />
      <input
        type="number"
        step="0.01"
        value={form.priceMin}
        onChange={(e) => setForm({ ...form, priceMin: Number(e.target.value) })}
        className="rounded-lg border border-ink/20 px-2 py-1"
      />
      <input
        type="number"
        step="0.01"
        placeholder="max"
        value={form.priceMax}
        onChange={(e) => setForm({ ...form, priceMax: e.target.value === "" ? "" : Number(e.target.value) })}
        className="rounded-lg border border-ink/20 px-2 py-1"
      />
      <input
        type="number"
        value={form.durationMinutes}
        onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
        className="rounded-lg border border-ink/20 px-2 py-1"
      />
      <button
        type="button"
        onClick={save}
        disabled={isPending}
        className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-cream-50 disabled:opacity-60"
      >
        {isPending ? "..." : "Enregistrer"}
      </button>
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await toggleServiceActive(service.id, !service.active);
            router.refresh();
          })
        }
        className="text-xs font-medium underline"
      >
        {service.active ? "Désactiver" : "Activer"}
      </button>
    </div>
  );
}

function NewServiceForm({ category }: { category: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await upsertService({ category, name, priceMin, durationMinutes });
      setName("");
      setPriceMin("");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex gap-2 text-sm">
      <input
        placeholder="Nouvelle prestation"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="flex-1 rounded-lg border border-ink/20 px-2 py-1"
      />
      <input
        placeholder="Prix"
        type="number"
        step="0.01"
        required
        value={priceMin}
        onChange={(e) => setPriceMin(e.target.value)}
        className="w-20 rounded-lg border border-ink/20 px-2 py-1"
      />
      <input
        placeholder="Min."
        type="number"
        required
        value={durationMinutes}
        onChange={(e) => setDurationMinutes(e.target.value)}
        className="w-20 rounded-lg border border-ink/20 px-2 py-1"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-full border border-ink px-3 py-1 text-xs font-semibold disabled:opacity-60"
      >
        Ajouter
      </button>
    </form>
  );
}

export function ServicesManager({ services }: { services: ServiceData[] }) {
  return (
    <div className="rounded-2xl border border-ink/10 p-5">
      <h2 className="font-display text-lg font-semibold">Prestations & tarifs</h2>
      <div className="mt-4 space-y-6">
        {CATEGORIES.map((cat) => {
          const items = services.filter((s) => s.category === cat.value);
          return (
            <div key={cat.value}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-light">{cat.label}</p>
              {items.map((s, i) => (
                <ServiceRow key={s.id} service={s} isFirst={i === 0} isLast={i === items.length - 1} />
              ))}
              <NewServiceForm category={cat.value} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
