import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { summarizeBusinessHours } from "@/lib/format";
import { InstagramIcon } from "@/components/instagram-icon";

export async function SiteFooter() {
  const hours = await prisma.businessHours.findMany();
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const summary = summarizeBusinessHours(hours);
  const address = settings?.address ?? "16, rue des Capucins, 6700 Arlon";

  return (
    <footer className="border-t border-ink/10 py-8 text-sm text-ink-light [padding-bottom:max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Image
            src="/logo_clawlab.png"
            alt="Claw lab"
            width={2000}
            height={2000}
            className="h-12 w-12 rounded-full shadow-md"
          />
          <a
            href="https://www.instagram.com/the_clawlab/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Claw lab sur Instagram"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chrome text-ink shadow transition hover:scale-105"
          >
            <InstagramIcon className="h-4 w-4" />
          </a>
        </div>
        <p className="mt-3">Blancaa Institut — {address}</p>
        <p className="mt-1">Paiement au salon.</p>
        {summary.map((g) => (
          <p key={g.label} className="mt-1">
            {g.label} : <span className="font-semibold text-ink">{g.hours}</span>
          </p>
        ))}
        <Link href="/mentions-legales" className="mt-4 inline-block text-xs text-ink-light/70 underline">
          Mentions légales &amp; confidentialité
        </Link>
      </div>
    </footer>
  );
}
