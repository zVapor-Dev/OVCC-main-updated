import { getEvent, getEvents } from "@/lib/truckersmp";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? params.get("event_id");
  try {
    if (id !== null) {
      if (!/^[1-9]\d{0,14}$/.test(id)) return json({ error: true, response: null }, 400);
      const event = await getEvent(id);
      return json({ error: !event, response: event }, event ? 200 : 404);
    }
    return json({ error: false, ...(await getEvents()) });
  } catch (error) {
    console.error("Event feed unavailable", error);
    return json({ error: true, response: id === null ? [] : null }, 503);
  }
}
