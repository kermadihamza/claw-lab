"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { settingsSchema, serviceSchema, businessHoursSchema } from "@/lib/validation";

export async function updateSettings(input: unknown) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { businessName, address, tvaNumber, bceNumber, cotisationAmount, bufferMinutes, loyerMensuel } =
    parsed.data;

  await prisma.settings.update({
    where: { id: "singleton" },
    data: {
      businessName,
      address,
      tvaNumber: tvaNumber || null,
      bceNumber: bceNumber || null,
      cotisationAmount: cotisationAmount === "" || cotisationAmount == null ? null : cotisationAmount,
      bufferMinutes,
      loyerMensuel,
    },
  });

  revalidatePath("/admin/parametres");
  revalidatePath("/admin");
  revalidatePath("/reserver");
  return { ok: true };
}

export async function updateBusinessHours(input: unknown) {
  const parsed = businessHoursSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Horaires invalides" };
  }
  const { dayOfWeek, isOpen, openTime, closeTime } = parsed.data;

  await prisma.businessHours.update({
    where: { dayOfWeek },
    data: {
      isOpen: !!isOpen,
      openTime: isOpen ? openTime || null : null,
      closeTime: isOpen ? closeTime || null : null,
    },
  });

  revalidatePath("/admin/parametres");
  revalidatePath("/reserver");
  revalidatePath("/");
  return { ok: true };
}

export async function upsertService(input: unknown) {
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Prestation invalide" };
  }
  const { id, category, name, priceMin, priceMax, durationMinutes, active, sortOrder } = parsed.data;

  const baseData = {
    category,
    name,
    priceMin,
    priceMax: priceMax === "" || priceMax == null ? null : priceMax,
    durationMinutes,
    active: active ?? true,
  };

  if (id) {
    await prisma.service.update({ where: { id }, data: { ...baseData, sortOrder: sortOrder ?? 0 } });
  } else {
    // Nouvelle prestation : par défaut, elle va à la fin de sa catégorie (pas de conflit de tri à 0).
    const last = await prisma.service.findFirst({ where: { category }, orderBy: { sortOrder: "desc" } });
    const nextSortOrder = sortOrder ?? (last ? last.sortOrder + 1 : 0);
    await prisma.service.create({ data: { ...baseData, sortOrder: nextSortOrder } });
  }

  revalidatePath("/admin/parametres");
  revalidatePath("/tarifs");
  revalidatePath("/reserver");
  return { ok: true };
}

export async function toggleServiceActive(id: string, active: boolean) {
  await prisma.service.update({ where: { id }, data: { active } });
  revalidatePath("/admin/parametres");
  revalidatePath("/tarifs");
  revalidatePath("/reserver");
}

/** Échange le sortOrder d'une prestation avec son voisin (au sein de la même catégorie) pour la déplacer. */
export async function moveService(serviceId: string, direction: "up" | "down") {
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service) return;

  const siblings = await prisma.service.findMany({
    where: { category: service.category },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const index = siblings.findIndex((s) => s.id === serviceId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= siblings.length) return;

  const other = siblings[swapIndex];
  await prisma.$transaction([
    prisma.service.update({ where: { id: service.id }, data: { sortOrder: other.sortOrder } }),
    prisma.service.update({ where: { id: other.id }, data: { sortOrder: service.sortOrder } }),
  ]);

  revalidatePath("/admin/parametres");
  revalidatePath("/tarifs");
  revalidatePath("/reserver");
}
