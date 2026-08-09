import Image from "next/image";
import Link from "next/link";
import { InstagramIcon } from "@/components/instagram-icon";

export default function HomePage() {
  return (
    <div
      className="relative flex h-dvh flex-col items-center overflow-hidden px-6 text-center"
      style={{
        paddingTop: "max(2rem, env(safe-area-inset-top))",
        paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
      }}
    >
      <a
        href="https://www.instagram.com/the_clawlab/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Claw lab sur Instagram"
        className="absolute flex h-11 w-11 items-center justify-center rounded-full bg-chrome text-ink shadow transition hover:scale-105 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
        style={{
          top: "max(1.5rem, env(safe-area-inset-top))",
          right: "clamp(1.5rem, 4vw, 4rem)",
        }}
      >
        <InstagramIcon className="h-5 w-5 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
      </a>

      <div className="relative flex flex-1 items-center justify-center">
        <Image
          src="/p.png"
          alt="Claw lab"
          width={545}
          height={498}
          priority
          className="h-[40vh] max-h-[420px] w-auto animate-gentle-float lg:h-[46vh] lg:max-h-[520px]"
        />
      </div>

      <p className="relative text-xs uppercase tracking-[0.3em] text-slate-600 sm:text-sm lg:text-base">
        Nail art à Arlon
      </p>
      <h1 className="relative mt-2 font-zoika text-5xl text-chrome sm:text-6xl lg:text-7xl">Claw lab</h1>

      <div className="relative mt-8 flex w-full max-w-xs flex-col gap-3 lg:max-w-sm">
        <Link
          href="/reserver"
          className="w-full rounded-full bg-chrome px-8 py-4 font-semibold text-ink shadow transition hover:scale-[1.02] lg:py-5 lg:text-lg"
        >
          Réserver un créneau
        </Link>
        <Link
          href="/tarifs"
          className="w-full rounded-full border border-slate-300 bg-white px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-50 lg:py-5 lg:text-lg"
        >
          Voir les tarifs
        </Link>
      </div>
    </div>
  );
}
