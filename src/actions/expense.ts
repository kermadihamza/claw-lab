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

export async function deleteExpense(id: string) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/admin/depenses");
  revalidatePath("/admin");
}
