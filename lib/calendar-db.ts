import { calendarWindow, visibleEntries, type EntryEvent, type EntrySource, type EntryToggles } from "./calendar";
import { db, postgresEnabled } from "./db";
import { getFeatures } from "./features";

export type CalendarEntries = { entries: EntryEvent[]; toggles: EntryToggles };

const none: CalendarEntries = { entries: [], toggles: { botEvents: false, manualEvents: false } };

/**
 * Bot panel and manual entries for the public calendar, behind their feature toggles.
 * Never throws: without PostgreSQL, or on a database error, the TMP calendar still works.
 */
export async function getCalendarEntries(shownTmpIds: Iterable<string | number>): Promise<CalendarEntries> {
  try {
    if (!postgresEnabled()) return none;
    const features = await getFeatures();
    const toggles = { botEvents: features["calendar.botEvents"], manualEvents: features["calendar.manualEvents"] };
    const sources: EntrySource[] = [];
    if (toggles.botEvents) sources.push("BOT_PANEL");
    if (toggles.manualEvents) sources.push("MANUAL");
    if (!sources.length) return { entries: [], toggles };
    const now = new Date();
    const { from, to } = calendarWindow(now);
    const rows = await db().calendarEntry.findMany({
      where: { source: { in: sources }, cancelled: false, startAt: { gte: from, lte: to } },
      orderBy: { startAt: "asc" },
      take: 1000,
    });
    return { entries: visibleEntries(rows, toggles, shownTmpIds, now), toggles };
  } catch (error) {
    console.error("Calendar entries unavailable", error);
    return none;
  }
}
