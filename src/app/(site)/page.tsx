import Link from "next/link";
import { ChromeBlobBackground } from "@/components/chrome-blob-background";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <ChromeBlobBackground />

      <div className="relative mx-auto flex min-h-[88vh] max-w-5xl flex-col justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-600 sm:text-sm">Nail art — Arlon</p>
        <div className="relative">
          <div className="absolute inset-0 -z-10 scale-150 bg-[radial-gradient(closest-side,rgba(250,247,240,0.9),transparent)] blur-2xl" />
          <h1 className="mt-6 font-zoika text-6xl tracking-tight text-chrome sm:text-8xl md:text-9xl">
            Claw lab
          </h1>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base text-ink-light sm:text-lg">
          Vernis semi-permanent, gainage sur ongle naturel, pose gel X et nail art sur-mesure, chez
          Blancaa Institut à Arlon.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/reserver"
            className="w-full rounded-full bg-chrome px-8 py-3 font-semibold text-ink shadow-lg shadow-ink/10 transition hover:scale-[1.02] sm:w-auto"
          >
            Réserver un créneau
          </Link>
          <Link
            href="/tarifs"
            className="w-full rounded-full border border-ink/20 px-8 py-3 font-semibold text-ink transition hover:bg-ink/5 sm:w-auto"
          >
            Voir les tarifs
          </Link>
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="grid gap-6 text-left sm:grid-cols-3">
          {[
            {
              title: "Vernis semi-permanent",
              desc: "Uni ou nail art, dépose comprise pour les décollements.",
            },
            {
              title: "Gainage & Gel X",
              desc: "Sur ongle naturel ou en capsules, du uni au nail art niveau 4.",
            },
            {
              title: "Manucure japonaise",
              desc: "Soin complet pour des ongles naturels sublimés.",
            },
          ].map((item) => (
            <div key={item.title} className="card-frosted rounded-2xl p-6 shadow-lg">
              <h2 className="font-display text-xl font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-ink-light">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
