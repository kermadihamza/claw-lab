import { prisma } from "@/lib/prisma";
import { getOpenWeekdays } from "@/lib/slots";
import { BookingWizard } from "@/components/booking-wizard";
import type { ServiceCategory } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réserver — Claw lab",
  description: "Réservez votre créneau nail art en ligne chez Claw lab, à Arlon.",
};

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  VERNIS_SEMI_PERMANENT: "Vernis semi-permanent / dépose",
  MANUCURE: "Manucure",
  GAINAGE: "Gainage sur ongle naturel",
  GEL_X: "Pose gel X",
};

export default async function ReserverPage() {
  const [services, openWeekdays] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    getOpenWeekdays(),
  ]);

  const serialized = services.map((s) => ({
    id: s.id,
    category: s.category,
    categoryLabel: CATEGORY_LABELS[s.category],
    name: s.name,
    priceMin: Number(s.priceMin),
    priceMax: s.priceMax != null ? Number(s.priceMax) : null,
    durationMinutes: s.durationMinutes,
    isRemovalService: s.isRemovalService,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-bold text-chrome sm:text-4xl">Réserver un créneau</h1>
      <p className="mt-3 text-ink-light">
        Choisissez votre prestation, puis un créneau disponible. Paiement au salon.
      </p>

      <BookingWizard services={serialized} openWeekdays={openWeekdays} />
    </div>
  );
}
