import type { Prisma } from "@/generated/prisma/client";

export type Json = Prisma.JsonValue;
export type Row = Prisma.JsonObject;
export const VTC_ID = 87827;

export function isRow(value: unknown): value is Row {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function field(value: unknown, key: string) {
  return isRow(value) ? text(value[key]) : "";
}

export function webUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    /* Missing or non-web URLs have no link in the UI. */
  }
}

export function mergeEvents(lists: Json[][]) {
  const seen = new Map<string, Row>();
  for (const list of lists) {
    for (const row of list) {
      if (!isRow(row) || !/^[1-9]\d*$/.test(String(row.id))) continue;
      const key = String(row.id);
      if (!seen.has(key)) seen.set(key, row);
    }
  }
  return [...seen.values()].sort((a, b) => text(a.start_at).localeCompare(text(b.start_at)));
}

export function partnerList(value: Json) {
  const wrapper = Array.isArray(value) ? value[0] : value;
  return isRow(wrapper) && Array.isArray(wrapper.partners) ? wrapper.partners : null;
}

export function acceptedPartners(value: Json) {
  return (partnerList(value) ?? []).flatMap((entry) => {
    if (!isRow(entry) || entry.status !== "Accepted") return [];
    const vtc = isRow(entry.sender) && Number(entry.sender.id) === VTC_ID ? entry.receiver : entry.sender;
    if (!isRow(vtc) || !vtc.id || !text(vtc.name)) return [];
    return [
      {
        id: String(vtc.id),
        name: text(vtc.name),
        slogan: text(vtc.slogan),
        logo: webUrl(vtc.logo),
        discord: webUrl(field(vtc.socials, "discord")),
        verified: vtc.verified === true,
      },
    ];
  });
}

export function eventView(row: Row) {
  const place = (location: unknown) => field(location, "city") || field(location, "location");
  const path = text(row.url);
  const canonical = path.startsWith("/events/") ? `https://truckersmp.com${path}` : webUrl(path);
  return {
    id: String(row.id),
    title: text(row.name) || "Unnamed Event",
    start: text(row.start_at),
    meetup: text(row.meetup_at) || text(row.start_at),
    host: field(row.vtc, "name") || field(row.user, "username") || "TruckersMP",
    game: field(row.game, "short") || text(row.game) || "ETS2",
    type: field(row.event_type, "name") || "Convoy",
    server: field(row.server, "name") || "TBA",
    route: `${place(row.departure) || "Origin"} ➔ ${place(row.arrive) || place(row.destination) || "Destination"}`,
    banner: webUrl(row.banner),
    map: webUrl(row.map),
    url: canonical?.startsWith("https://truckersmp.com/events/")
      ? canonical
      : `https://truckersmp.com/events/${encodeURIComponent(String(row.id))}`,
  };
}

export type CalendarEvent = ReturnType<typeof eventView>;
