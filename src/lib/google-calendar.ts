import { google, calendar_v3 } from "googleapis";

const APP_SOURCE_TAG = "clawlab-app";
const TIME_ZONE = "Europe/Brussels";

function getCalendar(): calendar_v3.Calendar | null {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY, GOOGLE_CALENDAR_ID } = process.env;
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || !GOOGLE_CALENDAR_ID) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

function calendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID as string;
}

/** Crée un événement dans Google Calendar pour une réservation de l'app, tagué pour ne pas être re-synchronisé au retour. */
export async function createCalendarEventForBooking(params: {
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}): Promise<string | null> {
  const calendar = getCalendar();
  if (!calendar) return null;

  try {
    const res = await calendar.events.insert({
      calendarId: calendarId(),
      requestBody: {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: { dateTime: params.start.toISOString(), timeZone: TIME_ZONE },
        end: { dateTime: params.end.toISOString(), timeZone: TIME_ZONE },
        extendedProperties: { private: { source: APP_SOURCE_TAG } },
      },
    });
    return res.data.id ?? null;
  } catch (err) {
    console.error("Échec de la création de l'événement Google Calendar:", err);
    return null;
  }
}

export async function updateCalendarEventForBooking(
  eventId: string,
  params: { summary: string; description?: string; location?: string; start: Date; end: Date }
): Promise<void> {
  const calendar = getCalendar();
  if (!calendar) return;

  try {
    await calendar.events.update({
      calendarId: calendarId(),
      eventId,
      requestBody: {
        summary: params.summary,
        description: params.description,
        location: params.location,
        start: { dateTime: params.start.toISOString(), timeZone: TIME_ZONE },
        end: { dateTime: params.end.toISOString(), timeZone: TIME_ZONE },
        extendedProperties: { private: { source: APP_SOURCE_TAG } },
      },
    });
  } catch (err) {
    console.error("Échec de la mise à jour de l'événement Google Calendar:", err);
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = getCalendar();
  if (!calendar) return;

  try {
    await calendar.events.delete({ calendarId: calendarId(), eventId });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    if (code === 404 || code === 410) return;
    console.error("Échec de la suppression de l'événement Google Calendar:", err);
  }
}

/** Liste les événements modifiés dans une fenêtre de temps, pour la synchro retour Calendar → app. */
export async function listCalendarEvents(params: {
  timeMin: Date;
  timeMax: Date;
}): Promise<calendar_v3.Schema$Event[]> {
  const calendar = getCalendar();
  if (!calendar) return [];

  const events: calendar_v3.Schema$Event[] = [];
  let pageToken: string | undefined;

  do {
    const res = await calendar.events.list({
      calendarId: calendarId(),
      timeMin: params.timeMin.toISOString(),
      timeMax: params.timeMax.toISOString(),
      singleEvents: true,
      pageToken,
    });
    events.push(...(res.data.items ?? []));
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);

  return events;
}

export function isAppCreatedEvent(event: calendar_v3.Schema$Event): boolean {
  return event.extendedProperties?.private?.source === APP_SOURCE_TAG;
}
