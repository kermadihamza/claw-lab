"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validation";

export async function createExpense(input: unknown) {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { date, category, description, amount, recurring } = parsed.data;

  await prisma.expense.create({
    data: {
      date: new Date(`${date}T12:00:00`),
      category,
      description,
      amount,
      recurring: !!recurring,
    },
  });

  revalidatePath("/admin/depenses");
  revalidatePath("/admin");
  return { ok: true };
}

export async function updateExpense(id: string, input: unknown) {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { date, category, description, amount, recurring } = parsed.data;

  await prisma.expense.update({
    where: { id },
    data: {
      date: new Date(`${date}T12:00:00`),
      category,
      description,
      amount,
      recurring: !!recurring,
    },
  });

  revalidatePath("/admin/depenses");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/admin/depenses");
  revalidatePath("/admin");
}

/**
 * Reprend chaque dépense marquée "récurrente" (la plus récente par catégorie+description) et en crée
 * une copie pour le mois en cours si elle n'existe pas déjà — évite les doublons si on clique plusieurs fois.
 */
export async function generateRecurringExpenses(): Promise<{ created: number }> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const templates = await prisma.expense.findMany({
    where: { recurring: true },
    orderBy: { date: "desc" },
  });

  const latestByKey = new Map<string, (typeof templates)[number]>();
  for (const e of templates) {
    const key = `${e.category}|${e.description}`;
    if (!latestByKey.has(key)) latestByKey.set(key, e);
  }

  const existingThisMonth = await prisma.expense.findMany({
    where: { date: { gte: monthStart, lt: monthEnd } },
    select: { category: true, description: true },
  });
  const existingKeys = new Set(existingThisMonth.map((e) => `${e.category}|${e.description}`));

  let created = 0;
  for (const [key, template] of Array.from(latestByKey)) {
    if (existingKeys.has(key)) continue;
    await prisma.expense.create({
      data: {
        date: new Date(now.getFullYear(), now.getMonth(), 1, 12),
        category: template.category,
        description: template.description,
        amount: template.amount,
        recurring: true,
      },
    });
    created++;
  }

  revalidatePath("/admin/depenses");
  revalidatePath("/admin");
  return { created };
}
