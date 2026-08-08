import { prisma } from "@/lib/prisma";
import { summarizeBusinessHours } from "@/lib/format";

export async function SiteFooter() {
  const hours = await prisma.businessHours.findMany();
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const summary = summarizeBusinessHours(hours);

  return (
    <footer className="mt-24 border-t border-ink/10 py-10 text-sm text-ink-light">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <p className="font-display text-lg text-chrome">Claw lab</p>
        <p className="mt-2">Blancaa Institut — {settings?.address}</p>
        <p className="mt-1">Paiement cash au salon.</p>
        {summary.map((line) => (
          <p key={line} className="mt-1">
            {line}
          </p>
        ))}
      </div>
    </footer>
  );
}
