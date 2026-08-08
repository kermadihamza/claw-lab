import { prisma } from "@/lib/prisma";
import { summarizeBusinessHours } from "@/lib/format";
import { InstagramIcon } from "@/components/instagram-icon";

export async function SiteFooter() {
  const hours = await prisma.businessHours.findMany();
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const summary = summarizeBusinessHours(hours);

  return (
    <footer className="border-t border-ink/10 py-8 text-sm text-ink-light [padding-bottom:max(2rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-display text-lg text-chrome">Claw lab</p>
          <a
            href="https://www.instagram.com/the_clawlab/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Claw lab sur Instagram"
            className="flex items-center gap-1.5 text-ink-light transition hover:text-slate-600"
          >
            <InstagramIcon className="h-5 w-5" />
            <span>@the_clawlab</span>
          </a>
        </div>
        <p className="mt-2">Blancaa Institut — {settings?.address}</p>
        <p className="mt-1">Paiement au salon.</p>
        {summary.map((line) => (
          <p key={line} className="mt-1">
            {line}
          </p>
        ))}
      </div>
    </footer>
  );
}
