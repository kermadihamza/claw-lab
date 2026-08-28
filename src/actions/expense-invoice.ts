"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/heic"];

export async function uploadExpenseInvoices(expenseId: string, formData: FormData) {
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) {
    return { ok: false, error: "Aucun fichier sélectionné" };
  }
  for (const file of files) {
    if (file.size > MAX_SIZE) {
      return { ok: false, error: `"${file.name}" dépasse la taille max (10 Mo)` };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { ok: false, error: `Type de fichier non supporté pour "${file.name}"` };
    }
  }

  await Promise.all(
    files.map(async (file) => {
      const data = Buffer.from(await file.arrayBuffer());
      return prisma.expenseInvoice.create({
        data: {
          expenseId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          data,
        },
      });
    })
  );

  revalidatePath("/admin/depenses");
  return { ok: true };
}

export async function deleteExpenseInvoice(id: string) {
  await prisma.expenseInvoice.delete({ where: { id } });
  revalidatePath("/admin/depenses");
}
