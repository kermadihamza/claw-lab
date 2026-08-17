import { z } from "zod";

export const bookingSchema = z.object({
  serviceId: z.string().min(1, "Choisissez une prestation"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  startTime: z.string().min(1, "Choisissez un créneau"),
  clientName: z.string().min(2, "Nom requis"),
  clientEmail: z.string().min(1, "Email requis").email("Email invalide"),
  clientPhone: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const expenseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(["LOYER", "COTISATION", "MATERIEL", "AUTRE"]),
  description: z.string().min(1, "Description requise"),
  amount: z.coerce.number().positive("Montant invalide"),
  recurring: z.coerce.boolean().optional(),
});

export const manualInvoiceSchema = z.object({
  clientName: z.string().min(1, "Nom requis"),
  clientAddress: z.string().optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().positive(),
      })
    )
    .min(1, "Ajoutez au moins une ligne"),
});

export const settingsSchema = z.object({
  businessName: z.string().min(1),
  address: z.string().min(1),
  tvaNumber: z.string().optional().or(z.literal("")),
  bceNumber: z.string().optional().or(z.literal("")),
  cotisationAmount: z.coerce.number().nonnegative().optional().or(z.literal("")),
  bufferMinutes: z.coerce.number().int().min(0).max(120),
  loyerMensuel: z.coerce.number().nonnegative(),
});

export const serviceSchema = z.object({
  id: z.string().optional(),
  category: z.enum(["VERNIS_SEMI_PERMANENT", "MANUCURE", "GAINAGE", "GEL_X"]),
  name: z.string().min(1),
  priceMin: z.coerce.number().positive(),
  priceMax: z.coerce.number().positive().optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().positive(),
  active: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const businessHoursSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  isOpen: z.coerce.boolean().optional(),
  openTime: z.string().optional().or(z.literal("")),
  closeTime: z.string().optional().or(z.literal("")),
});

export const manualBookingSchema = bookingSchema.extend({
  endTime: z.string().min(1),
  clientPhone: z.string().optional().or(z.literal("")),
  clientEmail: z.string().email("Email invalide").optional().or(z.literal("")),
});

/** Pour l'édition admin d'une réservation existante : email et téléphone peuvent tous les deux être absents
 *  (la réservation modifiée peut venir du flux client, du formulaire manuel, ou d'un import). */
export const bookingUpdateSchema = bookingSchema.extend({
  endTime: z.string().min(1),
  clientEmail: z.string().email("Email invalide").optional().or(z.literal("")),
  clientPhone: z.string().optional().or(z.literal("")),
});
