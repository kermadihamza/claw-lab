"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { manualInvoiceSchema } from "@/lib/validation";

async function nextInvoiceNumber(tx: Prisma.TransactionClient, year: number) {
  const last = await tx.invoice.findFirst({
    where: { year },
    orderBy: { sequence: "desc" },
  });
  const sequence = (last?.sequence ?? 0) + 1;
  const number = `${year}-${String(sequence).padStart(4, "0")}`;
  return { sequence, number };
}

export async function generateInvoiceFromBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true, invoice: true },
  });
  if (!booking) return { ok: false, error: "Rendez-vous introuvable" };
  if (booking.invoice) return { ok: false, error: "Une facture existe déjà pour ce rendez-vous" };

  const year = new Date().getFullYear();
  const unitPrice = Number(booking.service.priceMin);

  const invoice = await prisma.$transaction(async (tx) => {
    const { sequence, number } = await nextInvoiceNumber(tx, year);
    return tx.invoice.create({
      data: {
        number,
        year,
        sequence,
        bookingId: booking.id,
        clientName: booking.clientName,
        totalAmount: unitPrice,
        items: {
          create: [
            {
              description: `${booking.service.name} (${booking.service.category})`,
              quantity: 1,
              unitPrice,
              total: unitPrice,
            },
          ],
        },
      },
    });
  });

  revalidatePath("/admin/factures");
  return { ok: true, invoiceId: invoice.id };
}

/** Variante sans valeur de retour, pour être passée directement à un `<form action>`. */
export async function generateInvoiceFromBookingForm(bookingId: string) {
  await generateInvoiceFromBooking(bookingId);
}

export async function createManualInvoice(input: unknown) {
  const parsed = manualInvoiceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { clientName, clientAddress, items } = parsed.data;
  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const year = new Date().getFullYear();

  const invoice = await prisma.$transaction(async (tx) => {
    const { sequence, number } = await nextInvoiceNumber(tx, year);
    return tx.invoice.create({
      data: {
        number,
        year,
        sequence,
        clientName,
        clientAddress: clientAddress || null,
        totalAmount: total,
        items: {
          create: items.map((i) => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.quantity * i.unitPrice,
          })),
        },
      },
    });
  });

  revalidatePath("/admin/factures");
  return { ok: true, invoiceId: invoice.id };
}

export async function cancelInvoice(invoiceId: string) {
  await prisma.invoice.update({ where: { id: invoiceId }, data: { status: "CANCELLED" } });
  revalidatePath("/admin/factures");
}
