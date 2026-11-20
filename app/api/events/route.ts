import { getEvent, getEvents } from "@/lib/truckersmp";
import { getCalendarEntries } from "@/lib/calendar-db";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? params.get("event_id");
  if (id !== null) {
    try {
      if (!/^[1-9]\d{0,14}$/.test(id)) return json({ error: true, response: null }, 400);
      const event = await getEvent(id);
      return json({ error: !event, response: event }, event ? 200 : 404);
    } catch (error) {
      console.error("Event feed unavailable", error);
      return json({ error: true, response: null }, 503);
    }
  }
  let feed;
  try {
    feed = await getEvents();
  } catch (error) {
    console.error("Event feed unavailable", error);
  }
  // Bot panel and manual entries, behind their feature toggles. Never throws.
  const { entries } = await getCalendarEntries((feed?.response ?? []).map((row) => String(row.id)));
  if (!feed) return json({ error: true, response: [], entries }, 503);
  return json({ error: false, ...feed, entries });
}
