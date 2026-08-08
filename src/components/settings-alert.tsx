import Link from "next/link";
import { prisma } from "@/lib/prisma";

export async function SettingsAlert() {
  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const missing: string[] = [];
  if (!settings?.tvaNumber) missing.push("n° de TVA");
  if (!settings?.bceNumber) missing.push("n° BCE");
  if (settings?.cotisationAmount == null) missing.push("montant de cotisation");

  if (missing.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Champs en attente à compléter dès que connus : {missing.join(", ")}.{" "}
      <Link href="/admin/parametres" className="font-semibold underline">
        Aller aux paramètres
      </Link>
    </div>
  );
}
