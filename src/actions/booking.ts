"use server";

import { addMinutes } from "date-fns";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isSlotStillAvailable } from "@/lib/slots";
import { sendBookingConfirmationEmail, sendNewBookingNotification } from "@/lib/mail";
import { bookingSchema, manualBookingSchema } from "@/lib/validation";

export type BookingFormState = {
  ok: boolean;
  error?: string;
};

export async function createBooking(input: unknown): Promise<BookingFormState> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { serviceId, startTime, clientName, clientPhone, clientEmail, notes } = parsed.data;

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) {
    return { ok: false, error: "Cette prestation n'est plus disponible" };
  }

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    return { ok: false, error: "Créneau invalide" };
  }
  const end = addMinutes(start, service.durationMinutes);

  const stillAvailable = await isSlotStillAvailable(serviceId, start, end);
  if (!stillAvailable) {
    return { ok: false, error: "Ce créneau vient d'être réservé, merci d'en choisir un autre." };
  }

  const booking = await prisma.booking.create({
    data: {
      serviceId,
      startTime: start,
      endTime: end,
      clientName,
      clientPhone: clientPhone || null,
      clientEmail,
      notes: notes || null,
    },
  });

  const settings = await prisma.settings.findUnique({ where: { id: "singleton" } });
  const address = settings?.address ?? "16, rue des Capucins, 6700 Arlon";

  try {
    await sendBookingConfirmationEmail({
      bookingId: booking.id,
      to: clientEmail,
      clientName,
      serviceName: service.name,
      startTime: start,
      endTime: end,
      priceMin: service.priceMin as unknown as string,
      priceMax: service.priceMax as unknown as string | null,
      address,
    });
  } catch (err) {
    console.error("Échec de l'envoi de l'email de confirmation:", err);
  }

  try {
    await sendNewBookingNotification({
      bookingId: booking.id,
      clientName,
      clientEmail,
      clientPhone: clientPhone || null,
      serviceName: service.name,
      startTime: start,
      endTime: end,
      notes: notes || null,
      address,
    });
  } catch (err) {
    console.error("Échec de l'envoi de la notification de réservation:", err);
  }

  revalidatePath("/admin/reservations");
  redirect(`/reserver/confirmation/${booking.id}`);
}

export async function createManualBooking(input: unknown): Promise<BookingFormState> {
  const parsed = manualBookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const { serviceId, startTime, endTime, clientName, clientPhone, clientEmail, notes } = parsed.data;

  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { ok: false, error: "Créneau invalide" };
  }

  const stillAvailable = await isSlotStillAvailable(serviceId, start, end);
  if (!stillAvailable) {
    return { ok: false, error: "Ce créneau chevauche un autre rendez-vous ou blocage." };
  }

  await prisma.booking.create({
    data: {
      serviceId,
      startTime: start,
      endTime: end,
      clientName,
      clientPhone,
      clientEmail: clientEmail || null,
      notes: notes || null,
    },
  });

  revalidatePath("/admin/reservations");
  return { ok: true };
}

export async function updateBookingStatus(
  bookingId: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
) {
  await prisma.booking.update({ where: { id: bookingId }, data: { status } });
  revalidatePath("/admin/reservations");
  revalidatePath("/admin");
}

export async function createBlockedSlot(input: { startTime: string; endTime: string; reason?: string }) {
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { ok: false, error: "Plage invalide" };
  }
  await prisma.blockedSlot.create({
    data: { startTime: start, endTime: end, reason: input.reason || null },
  });
  revalidatePath("/admin/reservations");
  return { ok: true };
}

export async function deleteBlockedSlot(id: string) {
  await prisma.blockedSlot.delete({ where: { id } });
  revalidatePath("/admin/reservations");
}
