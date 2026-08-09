import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDateLong, formatTime } from "@/lib/format";
import { cancelBookingAction } from "@/actions/booking";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Annuler ma réservation — Claw lab",
};

export default async function CancelBookingPage({ params }: { params: { id: string } }) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { service: true },
  });

  if (!booking) notFound();

  const hoursUntil = (booking.startTime.getTime() - Date.now()) / (60 * 60 * 1000);
  const alreadyCancelled = booking.status === "CANCELLED";
  const tooLate = !alreadyCancelled && hoursUntil < 24;

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 sm:py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-600 sm:text-sm">Annulation</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-chrome sm:text-4xl">
        {alreadyCancelled
          ? "Réservation annulée"
          : tooLate
            ? "Trop tard pour annuler en ligne"
            : "Annuler ce rendez-vous ?"}
      </h1>

      <div className="card-frosted mt-10 rounded-2xl p-8 text-left">
        <p className="font-display text-xl font-semibold">{booking.service.name}</p>
        <p className="mt-3 text-sm capitalize text-ink-light">{formatDateLong(booking.startTime)}</p>
        <p className="text-sm text-ink-light">
          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
        </p>
      </div>

      {alreadyCancelled && (
        <p className="mt-8 text-sm text-ink-light">
          Ce rendez-vous a bien été annulé. À bientôt chez Claw lab !
        </p>
      )}

      {tooLate && (
        <p className="mt-8 text-sm text-ink-light">
          Il n&apos;est plus possible d&apos;annuler en ligne moins de 24h avant le rendez-vous.
          Contactez-nous directement via{" "}
          <a
            href="https://www.instagram.com/the_clawlab/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 underline"
          >
            Instagram
          </a>
          .
        </p>
      )}

      {!alreadyCancelled && !tooLate && (
        <form action={cancelBookingAction.bind(null, booking.id)} className="mt-8">
          <button
            type="submit"
            className="rounded-full bg-ink px-8 py-3 font-semibold text-cream-50 transition hover:bg-ink-light"
          >
            Confirmer l&apos;annulation
          </button>
        </form>
      )}

      <Link
        href="/"
        className="mt-8 inline-block rounded-full border border-ink/20 px-8 py-3 font-semibold text-ink transition hover:bg-ink/5"
      >
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
