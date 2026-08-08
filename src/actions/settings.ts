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

  const data = {
    category,
    name,
    priceMin,
    priceMax: priceMax === "" || priceMax == null ? null : priceMax,
    durationMinutes,
    active: active ?? true,
    sortOrder: sortOrder ?? 0,
  };

  if (id) {
    await prisma.service.update({ where: { id }, data });
  } else {
    await prisma.service.create({ data });
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
