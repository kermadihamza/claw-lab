import nodemailer from "nodemailer";
import {
  bookingConfirmationEmail,
  newBookingNotificationEmail,
  cancellationNotificationEmail,
} from "@/lib/email-templates";
import { buildBookingICS } from "@/lib/ics";

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

function fromAddress() {
  return process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "Claw lab <no-reply@clawlab.be>";
}

function icsAttachment(params: { bookingId: string; summary: string; location: string; startTime: Date; endTime: Date }) {
  const ics = buildBookingICS({
    uid: `${params.bookingId}@clawlab.be`,
    summary: params.summary,
    location: params.location,
    start: params.startTime,
    end: params.endTime,
  });
  return {
    filename: "rdv-clawlab.ics",
    content: ics,
    contentType: "text/calendar; charset=utf-8; method=PUBLISH",
  };
}

export async function sendBookingConfirmationEmail(params: {
  bookingId: string;
  to: string;
  clientName: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  priceMin: number | string;
  priceMax: number | string | null;
  address: string;
  deposeLabel?: string | null;
}) {
  const t = getTransporter();
  if (!t) {
    console.warn("SMTP non configuré (SMTP_HOST/PORT/USER/PASS manquants) : email de confirmation non envoyé.");
    return;
  }

  const { subject, text, html } = bookingConfirmationEmail(params);
  await t.sendMail({
    from: fromAddress(),
    replyTo: process.env.SMTP_USER,
    to: params.to,
    subject,
    text,
    html,
    attachments: [
      icsAttachment({
        bookingId: params.bookingId,
        summary: `${params.serviceName} — Claw lab`,
        location: params.address,
        startTime: params.startTime,
        endTime: params.endTime,
      }),
    ],
  });
}

/** Notifie le salon (adresse NOTIFY_EMAIL, ou SMTP_USER par défaut) d'une nouvelle réservation. */
export async function sendNewBookingNotification(params: {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  notes: string | null;
  address: string;
  deposeLabel?: string | null;
}) {
  const t = getTransporter();
  const notifyTo = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;
  if (!t || !notifyTo) {
    console.warn("SMTP non configuré : notification de nouvelle réservation non envoyée.");
    return;
  }

  const { subject, text, html } = newBookingNotificationEmail(params);
  await t.sendMail({
    from: fromAddress(),
    replyTo: params.clientEmail,
    to: notifyTo,
    subject,
    text,
    html,
    attachments: [
      icsAttachment({
        bookingId: params.bookingId,
        summary: `${params.serviceName} — ${params.clientName}`,
        location: params.address,
        startTime: params.startTime,
        endTime: params.endTime,
      }),
    ],
  });
}

/** Notifie le salon qu'une cliente a annulé son rendez-vous en ligne. */
export async function sendCancellationNotification(params: {
  clientName: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
}) {
  const t = getTransporter();
  const notifyTo = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;
  if (!t || !notifyTo) {
    console.warn("SMTP non configuré : notification d'annulation non envoyée.");
    return;
  }

  const { subject, text, html } = cancellationNotificationEmail(params);
  await t.sendMail({ from: fromAddress(), to: notifyTo, subject, text, html });
}
