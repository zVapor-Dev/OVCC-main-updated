// Pure calendar logic: no database or framework imports, so it can be tested directly.
import { webUrl, type CalendarEvent } from "./truckersmp-data";

export const ENTRY_SOURCES = ["BOT_PANEL", "MANUAL"] as const;
export const ENTRY_KINDS = ["CONVOY", "INTERNAL_CONVOY", "MEETING", "OTHER"] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];
export type EntryKind = (typeof ENTRY_KINDS)[number];

export const KIND_LABELS: Record<EntryKind, string> = {
  CONVOY: "Convoy",
  INTERNAL_CONVOY: "Internal convoy",
  MEETING: "Meeting",
  OTHER: "Other",
};

export const SOURCE_LABELS: Record<EntrySource, string> = {
  BOT_PANEL: "Discord event",
  MANUAL: "Orvion entry",
};

export const LIMITS = { title: 120, description: 2000, location: 120, url: 500 } as const;

/** Entries outside this window are not shown publicly. */
export const WINDOW_PAST_DAYS = 60;
export const WINDOW_FUTURE_DAYS = 365;
const DAY = 86_400_000;

export function calendarWindow(now = new Date()) {
  return {
    from: new Date(now.getTime() - WINDOW_PAST_DAYS * DAY),
    to: new Date(now.getTime() + WINDOW_FUTURE_DAYS * DAY),
  };
}

/** The fields of a CalendarEntry row this module needs. */
export type EntryRow = {
  id: string;
  source: EntrySource;
  kind: EntryKind;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  url: string | null;
  public: boolean;
  cancelled: boolean;
  tmpEventId: number | null;
};

export type EntryToggles = { botEvents: boolean; manualEvents: boolean };

/** A public non-TMP entry, with everything the dialog shows. */
export type PublicEntryEvent = {
  id: string;
  source: EntrySource;
  booked: false;
  kind: EntryKind;
  title: string;
  start: string;
  end: string | null;
  location: string | null;
  description: string | null;
  url: string | null;
};

/** A non-public entry: only the time slot is shown, as "Booked". */
export type BookedEntryEvent = {
  id: string;
  source: EntrySource;
  booked: true;
  title: "Booked";
  start: string;
  end: string | null;
};

export type EntryEvent = PublicEntryEvent | BookedEntryEvent;
export type TmpCalendarEvent = CalendarEvent & { source: "TMP" };
export type CalendarItem = TmpCalendarEvent | EntryEvent;

export function isEntry(item: CalendarItem): item is EntryEvent {
  return item.source !== "TMP";
}

/** Same format as TruckersMP's start_at: "YYYY-MM-DD HH:MM:SS" in UTC. */
export function utcStamp(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export function entryView(row: EntryRow): EntryEvent {
  const base = {
    id: `entry-${row.id}`,
    source: row.source,
    start: utcStamp(row.startAt),
    end: row.endAt ? utcStamp(row.endAt) : null,
  };
  if (!row.public) return { ...base, booked: true, title: "Booked" };
  return {
    ...base,
    booked: false,
    kind: row.kind,
    title: row.title,
    location: row.location || null,
    description: row.description || null,
    url: (row.url && webUrl(row.url)) ?? null,
  };
}

/**
 * Picks the entries that belong on the public calendar: the source's feature is on,
 * not cancelled, inside the window, and (for bot panels) not a copy of a TMP event
 * that is already shown.
 */
export function visibleEntries(
  rows: EntryRow[],
  toggles: EntryToggles,
  shownTmpIds: Iterable<string | number>,
  now = new Date(),
): EntryEvent[] {
  const tmpIds = new Set([...shownTmpIds].map(String));
  const { from, to } = calendarWindow(now);
  return rows
    .filter((row) => (row.source === "BOT_PANEL" ? toggles.botEvents : toggles.manualEvents))
    .filter((row) => !row.cancelled)
    .filter((row) => !Number.isNaN(row.startAt.getTime()) && row.startAt >= from && row.startAt <= to)
    .filter((row) => !(row.source === "BOT_PANEL" && row.tmpEventId != null && tmpIds.has(String(row.tmpEventId))))
    .map(entryView);
}

/** TMP events plus entries, in start order. TMP events come first on a tie. */
export function mergeCalendar(tmp: CalendarEvent[], entries: EntryEvent[]): CalendarItem[] {
  const items: CalendarItem[] = [...tmp.map((event) => ({ ...event, source: "TMP" as const })), ...entries];
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.start.localeCompare(b.item.start) || a.index - b.index)
    .map(({ item }) => item);
}

// ---------------------------------------------------------------------------
// Admin form validation
// ---------------------------------------------------------------------------

export type EntryInput = {
  kind: EntryKind;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  url: string | null;
  public: boolean;
};

export type ParseResult = { ok: true; value: EntryInput } | { ok: false; error: string };

type FormLike = { get(name: string): unknown };

function str(form: FormLike, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Parses "YYYY-MM-DD" + "HH:MM" as UTC. Returns null for anything that is not a real date. */
export function parseUtc(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const value = new Date(`${date}T${time}:00.000Z`);
  if (Number.isNaN(value.getTime())) return null;
  // Rejects dates like 2026-02-30 that Date would roll over.
  if (value.toISOString().slice(0, 16) !== `${date}T${time}`) return null;
  return value;
}

export function parseEntryForm(form: FormLike): ParseResult {
  const fail = (error: string): ParseResult => ({ ok: false, error });
  const kind = str(form, "kind");
  if (!(ENTRY_KINDS as readonly string[]).includes(kind)) return fail("Choose a valid kind.");

  const title = str(form, "title");
  if (!title) return fail("Title is required.");
  if (title.length > LIMITS.title) return fail(`Title must be at most ${LIMITS.title} characters.`);

  const description = str(form, "description");
  if (description.length > LIMITS.description)
    return fail(`Description must be at most ${LIMITS.description} characters.`);

  const location = str(form, "location");
  if (location.length > LIMITS.location) return fail(`Location must be at most ${LIMITS.location} characters.`);

  const rawUrl = str(form, "url");
  let url: string | null = null;
  if (rawUrl) {
    if (rawUrl.length > LIMITS.url) return fail(`URL must be at most ${LIMITS.url} characters.`);
    url = webUrl(rawUrl) ?? null;
    if (!url) return fail("URL must start with http:// or https://.");
  }

  const startDate = str(form, "startDate");
  const startAt = parseUtc(startDate, str(form, "startTime"));
  if (!startAt) return fail("Enter a valid start date and time.");
  const year = startAt.getUTCFullYear();
  if (year < 2000 || year > 2100) return fail("Start date is out of range.");

  const endDate = str(form, "endDate");
  const endTime = str(form, "endTime");
  let endAt: Date | null = null;
  if (endDate || endTime) {
    if (!endTime) return fail("Enter an end time, or leave both end fields empty.");
    endAt = parseUtc(endDate || startDate, endTime);
    if (!endAt) return fail("Enter a valid end date and time.");
    if (endAt < startAt) return fail("End must not be before start.");
  }

  return {
    ok: true,
    value: {
      kind: kind as EntryKind,
      title,
      description: description || null,
      startAt,
      endAt,
      location: location || null,
      url,
      public: form.get("public") === "on",
    },
  };
}

/** CalendarEntry ids are cuids. */
export function isEntryId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]{8,40}$/i.test(value);
}
