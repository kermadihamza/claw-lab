import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateLong, formatTime, formatEUR } from "@/lib/format";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Réservation confirmée — Claw lab",
};

export default async function ConfirmationPage({ params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { service: true },
  });

  if (!booking) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 sm:py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-600 sm:text-sm">Réservation confirmée</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-chrome sm:text-4xl">À bientôt !</h1>

      <div className="card-frosted mt-10 rounded-2xl p-8 text-left">
        <p className="font-display text-xl font-semibold">{booking.service.name}</p>
        <p className="mt-1 text-sm text-ink-light">
          {booking.service.category === "MANUCURE" ? "Manucure" : booking.service.category}
        </p>
        <div className="mt-4 space-y-1 text-sm">
          <p className="capitalize">{formatDateLong(booking.startTime)}</p>
          <p>
            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </p>
          <p className="mt-3 font-medium">
            À régler au salon : {formatEUR(booking.service.priceMin as unknown as string)}
            {booking.service.priceMax != null ? " et plus, selon complexité" : ""}
          </p>
        </div>
        <div className="mt-6 border-t border-ink/10 pt-4 text-sm">
          <p className="font-medium">{booking.clientName}</p>
          <p>{booking.clientEmail}</p>
          {booking.clientPhone && <p>{booking.clientPhone}</p>}
        </div>
      </div>

      <p className="mt-8 text-sm text-ink-light">
        Un email de confirmation vient de vous être envoyé à {booking.clientEmail}.
      </p>
      <p className="mt-2 text-sm text-ink-light">
        Blancaa Institut — 16, rue des Capucins, 6700 Arlon
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full border border-ink/20 px-8 py-3 font-semibold text-ink transition hover:bg-ink/5"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
