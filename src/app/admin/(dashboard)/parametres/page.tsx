import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";
import { BusinessHoursForm } from "@/components/admin/business-hours-form";
import { ServicesManager } from "@/components/admin/services-manager";

export const dynamic = "force-dynamic";

export default async function ParametresPage() {
  const [settings, hours, services] = await Promise.all([
    prisma.settings.findUnique({ where: { id: "singleton" } }),
    prisma.businessHours.findMany(),
    prisma.service.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
  ]);

  if (!settings) return null;

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Paramètres</h1>

      <div className="mt-8 space-y-8">
        <SettingsForm
          settings={{
            businessName: settings.businessName,
            address: settings.address,
            tvaNumber: settings.tvaNumber,
            bceNumber: settings.bceNumber,
            cotisationAmount: settings.cotisationAmount != null ? Number(settings.cotisationAmount) : null,
            bufferMinutes: settings.bufferMinutes,
            loyerMensuel: Number(settings.loyerMensuel),
          }}
        />

        <BusinessHoursForm hours={hours} />

        <ServicesManager
          services={services.map((s) => ({
            id: s.id,
            category: s.category,
            name: s.name,
            priceMin: Number(s.priceMin),
            priceMax: s.priceMax != null ? Number(s.priceMax) : null,
            durationMinutes: s.durationMinutes,
            active: s.active,
            sortOrder: s.sortOrder,
          }))}
        />
      </div>
    </div>
  );
}
