import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales & confidentialité — Claw lab",
};

export default async function MentionsLegalesPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const address = settings?.address ?? "16, rue des Capucins, 6700 Arlon";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="font-display text-3xl font-bold text-chrome sm:text-4xl">
        Mentions légales &amp; confidentialité
      </h1>

      <div className="card-frosted mt-10 space-y-8 rounded-2xl p-6 text-sm leading-relaxed sm:p-8">
        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Éditeur du site</h2>
          <p className="mt-2 text-ink-light">
            Claw lab — Blancaa Institut
            <br />
            {address}
            {settings?.bceNumber ? (
              <>
                <br />
                N° d&apos;entreprise (BCE) : {settings.bceNumber}
              </>
            ) : null}
            {settings?.tvaNumber ? (
              <>
                <br />
                TVA : {settings.tvaNumber}
              </>
            ) : null}
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Hébergement</h2>
          <p className="mt-2 text-ink-light">
            Ce site est hébergé par Vercel Inc. La base de données est hébergée par Neon, dans un centre
            de données situé en Europe (Francfort, Allemagne).
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Données collectées</h2>
          <p className="mt-2 text-ink-light">
            Lorsque vous réservez un créneau, nous collectons votre nom, votre adresse email, votre
            numéro de téléphone (facultatif) et d&apos;éventuelles remarques. Ces informations sont
            utilisées uniquement pour :
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-light">
            <li>gérer votre rendez-vous et vous en envoyer la confirmation par email ;</li>
            <li>vous contacter en cas de besoin concernant votre réservation ;</li>
            <li>établir les documents comptables requis par la loi (facturation).</li>
          </ul>
          <p className="mt-2 text-ink-light">
            Ces données ne sont jamais vendues ni transmises à des tiers à des fins commerciales. Elles
            sont conservées le temps nécessaire à la gestion de la relation client et aux obligations
            comptables légales, puis supprimées.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Cookies</h2>
          <p className="mt-2 text-ink-light">
            Ce site n&apos;utilise aucun cookie publicitaire ou de suivi statistique.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Vos droits</h2>
          <p className="mt-2 text-ink-light">
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de
            suppression de vos données. Pour l&apos;exercer, contactez-nous via Instagram (
            <a
              href="https://www.instagram.com/the_clawlab/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 underline"
            >
              @the_clawlab
            </a>
            ) ou lors de votre passage au salon.
          </p>
        </section>
      </div>
    </div>
  );
}
