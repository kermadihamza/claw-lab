import { formatDateLong, formatEUR, formatTime } from "@/lib/format";

function siteUrl() {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function calendarUrl(bookingId: string) {
  return `${siteUrl()}/api/bookings/${bookingId}/ics`;
}

function cancelUrl(bookingId: string) {
  return `${siteUrl()}/reserver/annuler/${bookingId}`;
}

function calendarButtonHtml(bookingId: string) {
  return `<p style="margin:20px 0 0;text-align:center;">
  <a href="${calendarUrl(bookingId)}" style="display:inline-block;background-color:#4c6a97;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;padding:12px 24px;border-radius:9999px;">
    📅 Ajouter au calendrier
  </a>
</p>`;
}

function instagramButtonHtml() {
  return `<p style="margin:12px 0 0;text-align:center;">
  <a href="https://www.instagram.com/the_clawlab/" style="display:inline-block;background-color:#e2e5e8;color:#20242c;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;padding:12px 24px;border-radius:9999px;">
    📷 Suivre @the_clawlab
  </a>
</p>`;
}

export function bookingConfirmationEmail(params: {
  bookingId: string;
  clientName: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  priceMin: number | string;
  priceMax: number | string | null;
  address: string;
}) {
  const { bookingId, clientName, serviceName, startTime, endTime, priceMin, priceMax, address } = params;
  const logoUrl = `${siteUrl()}/logo_clawlab.png`;

  const priceLabel =
    priceMax != null
      ? `${formatEUR(priceMin).replace(",00", "")} - ${formatEUR(priceMax)} (selon complexité)`
      : formatEUR(priceMin);

  const subject = "Confirmation de votre rendez-vous — Claw lab";

  const text = `À bientôt, ${clientName} !

${serviceName}
${formatDateLong(startTime)}
${formatTime(startTime)} - ${formatTime(endTime)}
À régler au salon : ${priceLabel}

Blancaa Institut — ${address}
Paiement au salon.

Ajouter au calendrier : ${calendarUrl(bookingId)}

En attendant votre rendez-vous, suivez-nous sur Instagram : https://www.instagram.com/the_clawlab/

Besoin d'annuler ? C'est possible jusqu'à 24h avant votre rendez-vous : ${cancelUrl(bookingId)}`;

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:32px 16px;background-color:#faf7f0;font-family:Georgia,'Times New Roman',serif;color:#20242c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
      <tr>
        <td style="text-align:center;padding-bottom:24px;">
          <img src="${logoUrl}" alt="Claw lab" width="72" height="72" style="border-radius:9999px;display:inline-block;" />
        </td>
      </tr>
      <tr>
        <td style="text-align:center;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#4c6a97;">
            Réservation confirmée
          </p>
          <h1 style="margin:12px 0 0;font-size:28px;font-weight:700;color:#20242c;">À bientôt, ${clientName} !</h1>
        </td>
      </tr>
      <tr>
        <td style="padding-top:28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid rgba(32,36,44,0.1);border-radius:16px;">
            <tr>
              <td style="padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;">
                <p style="margin:0;font-size:17px;font-weight:700;font-family:Georgia,serif;color:#20242c;">${serviceName}</p>
                <p style="margin:12px 0 0;text-transform:capitalize;">${formatDateLong(startTime)}</p>
                <p style="margin:4px 0 0;">${formatTime(startTime)} - ${formatTime(endTime)}</p>
                <p style="margin:16px 0 0;font-weight:700;">À régler au salon : ${priceLabel}</p>
              </td>
            </tr>
          </table>
          ${calendarButtonHtml(bookingId)}
          ${instagramButtonHtml()}
        </td>
      </tr>
      <tr>
        <td style="padding-top:28px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#454c5a;">
          <p style="margin:0;">Blancaa Institut — ${address}</p>
          <p style="margin:8px 0 0;">Paiement au salon.</p>
          <p style="margin:16px 0 0;">
            Besoin d&apos;annuler ? C&apos;est possible jusqu&apos;à 24h avant votre rendez-vous :
            <a href="${cancelUrl(bookingId)}" style="color:#4c6a97;">annuler ma réservation</a>.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export function newBookingNotificationEmail(params: {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  notes: string | null;
}) {
  const { bookingId, clientName, clientEmail, clientPhone, serviceName, startTime, endTime, notes } = params;
  const subject = `Nouvelle réservation — ${clientName}`;

  const text = `Nouvelle réservation reçue.

${serviceName}
${formatDateLong(startTime)}
${formatTime(startTime)} - ${formatTime(endTime)}

Client : ${clientName}
Email : ${clientEmail}
Téléphone : ${clientPhone ?? "non renseigné"}
${notes ? `Remarques : ${notes}` : ""}

Ajouter au calendrier : ${calendarUrl(bookingId)}`;

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:32px 16px;background-color:#faf7f0;font-family:Arial,Helvetica,sans-serif;color:#20242c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
      <tr>
        <td>
          <p style="margin:0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#4c6a97;">
            Nouvelle réservation
          </p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;font-family:Georgia,serif;color:#20242c;">${serviceName}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding-top:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid rgba(32,36,44,0.1);border-radius:16px;">
            <tr>
              <td style="padding:20px;font-size:14px;line-height:1.6;">
                <p style="margin:0;text-transform:capitalize;">${formatDateLong(startTime)}</p>
                <p style="margin:4px 0 0;">${formatTime(startTime)} - ${formatTime(endTime)}</p>
                <hr style="margin:16px 0;border:none;border-top:1px solid rgba(32,36,44,0.1);" />
                <p style="margin:0;font-weight:700;">${clientName}</p>
                <p style="margin:4px 0 0;">${clientEmail}</p>
                <p style="margin:4px 0 0;">${clientPhone ?? "Téléphone non renseigné"}</p>
                ${notes ? `<p style="margin:12px 0 0;font-style:italic;">${notes}</p>` : ""}
              </td>
            </tr>
          </table>
          ${calendarButtonHtml(bookingId)}
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}

export function cancellationNotificationEmail(params: {
  clientName: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
}) {
  const { clientName, serviceName, startTime, endTime } = params;
  const subject = `Réservation annulée — ${clientName}`;

  const text = `${clientName} vient d'annuler son rendez-vous.

${serviceName}
${formatDateLong(startTime)}
${formatTime(startTime)} - ${formatTime(endTime)}

Ce créneau est de nouveau disponible.`;

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:32px 16px;background-color:#faf7f0;font-family:Arial,Helvetica,sans-serif;color:#20242c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
      <tr>
        <td>
          <p style="margin:0;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#b23b3b;">
            Réservation annulée
          </p>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;font-family:Georgia,serif;color:#20242c;">${serviceName}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding-top:20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid rgba(32,36,44,0.1);border-radius:16px;">
            <tr>
              <td style="padding:20px;font-size:14px;line-height:1.6;">
                <p style="margin:0;text-transform:capitalize;">${formatDateLong(startTime)}</p>
                <p style="margin:4px 0 0;">${formatTime(startTime)} - ${formatTime(endTime)}</p>
                <hr style="margin:16px 0;border:none;border-top:1px solid rgba(32,36,44,0.1);" />
                <p style="margin:0;">${clientName} a annulé ce rendez-vous. Ce créneau est de nouveau disponible.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, text, html };
}
