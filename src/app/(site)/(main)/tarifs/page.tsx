import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatEUR } from "@/lib/format";
import { InstagramIcon } from "@/components/instagram-icon";
import type { ServiceCategory } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs — Claw lab",
  description:
    "Grille tarifaire complète Claw lab : vernis semi-permanent, manucure japonaise, gainage, pose gel X et nail art à Arlon.",
};

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  VERNIS_SEMI_PERMANENT: "Vernis semi-permanent / dépose",
  MANUCURE: "Manucure",
  GAINAGE: "Gainage sur ongle naturel",
  GEL_X: "Pose gel X",
};

const CATEGORY_ORDER: ServiceCategory[] = [
  "VERNIS_SEMI_PERMANENT",
  "MANUCURE",
  "GAINAGE",
  "GEL_X",
];

function priceLabel(min: number | string, max: number | string | null) {
  const minN = typeof min === "string" ? parseFloat(min) : min;
  if (max == null) return formatEUR(minN);
  const maxN = typeof max === "string" ? parseFloat(max) : max;
  return `${formatEUR(minN).replace(",00", "")} - ${formatEUR(maxN)}`;
}

function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

export default async function TarifsPage() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const byCategory = CATEGORY_ORDER.map((category) => ({
    category,
    items: services.filter((s) => s.category === category),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-bold text-chrome sm:text-4xl">Prestations et tarifs</h1>
      <p className="mt-3 text-ink-light">
        Paiement au salon. Les durées indiquées incluent le temps de pose complet.
      </p>

      <a
        href="/prix_clawlab.jpeg"
        download="claw-lab-tarifs.jpeg"
        className="card-frosted mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 shadow-lg transition hover:scale-[1.01] sm:flex-nowrap"
      >
        <div className="flex items-center gap-4">
          <Image
            src="/prix_clawlab.jpeg"
            alt=""
            aria-hidden
            width={56}
            height={79}
            className="rounded-lg shadow-sm"
          />
          <div>
            <p className="font-display text-lg font-semibold text-ink">Grille tarifaire en image</p>
            <p className="text-sm text-ink-light">Pratique à télécharger ou partager</p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-chrome px-5 py-2 text-sm font-semibold text-ink shadow">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10 2a1 1 0 0 1 1 1v7.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L9 10.586V3a1 1 0 0 1 1-1Z" />
            <path d="M4 15a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z" />
          </svg>
          Télécharger
        </span>
      </a>

      <div className="card-frosted mt-10 divide-y divide-ink/10 rounded-2xl p-6 shadow-lg sm:p-8">
        {byCategory.map((group) => (
          <section key={group.category} className="py-6 first:pt-0 last:pb-0">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-600 sm:text-base">
              {CATEGORY_LABELS[group.category]}
            </h2>
            <ul className="mt-3 divide-y divide-ink/10">
              {group.items.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 transition hover:bg-ink/[0.03]"
                >
                  <div>
                    <p className="font-medium text-ink">{s.name}</p>
                    <p className="text-xs text-ink-light/70">{durationLabel(s.durationMinutes)}</p>
                  </div>
                  <p className="font-display text-lg font-semibold text-ink">
                    {priceLabel(s.priceMin as unknown as string, s.priceMax as unknown as string | null)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="card-frosted mt-14 rounded-2xl p-6 text-sm leading-relaxed">
        <p>
          <strong>Nail art niveau 1</strong> : 1 à 2 ongles décorés, design simple.
        </p>
        <p className="mt-1">
          <strong>Nail art niveau 2</strong> : 3 à 4 ongles décorés, effet chrome, babyboomer.
        </p>
        <p className="mt-1">
          <strong>Nail art niveau 3</strong> : 5 à 7 ongles décorés, design élaboré.
        </p>
        <p className="mt-1">
          <strong>Nail art niveau 4</strong> : 8 à 10 ongles décorés, design complexe.
        </p>
        <p className="mt-4 text-xs text-ink-light">
          N&apos;hésitez pas à demander quel est le niveau de nail art de votre modèle.
        </p>
      </div>

      <a
        href="https://www.instagram.com/the_clawlab/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-chrome px-5 py-3 text-sm font-semibold text-ink shadow transition hover:scale-[1.02] sm:px-8 sm:py-4 sm:text-base"
      >
        <InstagramIcon className="h-5 w-5 shrink-0" />
        <span className="sm:hidden">Nos réalisations Instagram</span>
        <span className="hidden sm:inline">Voir nos réalisations sur Instagram</span>
      </a>
    </div>
  );
}
