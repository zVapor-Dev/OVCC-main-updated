import { db } from "./db";
import { type Json, isRow, mergeEvents, partnerList, VTC_ID } from "./truckersmp-data";

class UpstreamError extends Error {
  constructor(readonly status: number) {
    super(`TruckersMP returned HTTP ${status}`);
  }
}

async function request(path: string): Promise<Json> {
  const res = await fetch(`https://api.truckersmp.com/v2/${path}`, {
    headers: { Accept: "application/json", "User-Agent": "OrvionCC-Website/1.0" },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!res.ok) throw new UpstreamError(res.status);
  const body: unknown = await res.json();
  if (!isRow(body) || body.error || body.response == null) throw new Error("Invalid TruckersMP response");
  return body.response;
}

async function feed<T extends Exclude<Json, null>>(
  path: string,
  minutes: number,
  valid: (payload: Json) => payload is T,
) {
  const table = db().truckersMpFeed;
  const saved = await table.findUnique({ where: { key: path } });
  const previous = saved && valid(saved.payload) ? { value: saved.payload, time: saved.updatedAt } : null;
  if (previous && Date.now() - previous.time.getTime() < minutes * 60_000) {
    return { value: previous.value, stale: false };
  }
  let value: Json;
  try {
    value = await request(path);
    if (!valid(value)) throw new Error("Unexpected TruckersMP feed format");
  } catch (error) {
    if (!previous) throw error;
    console.warn(`Using saved TruckersMP feed: ${path}`, error);
    return { value: previous.value, stale: true };
  }
  await table.upsert({
    where: { key: path },
    create: { key: path, payload: value },
    update: { payload: value },
  });
  return { value, stale: false };
}

const base = `vtc/${VTC_ID}`;
const isList = (value: Json): value is Json[] => Array.isArray(value);

export async function getEvents() {
  const sources = await Promise.allSettled([
    feed(`${base}/events`, 15, isList),
    feed(`${base}/events/attending`, 15, isList),
  ]);
  const available = sources.flatMap((source) => (source.status === "fulfilled" ? [source.value] : []));
  if (!available.length)
    throw new Error("Neither TruckersMP event feed is available", {
      cause: sources[0].status === "rejected" ? sources[0].reason : undefined,
    });
  const partial = available.length !== sources.length;
  if (partial) console.warn("One TruckersMP event feed is unavailable");
  return {
    response: mergeEvents(available.map((feed) => feed.value)),
    partial,
    stale: available.some((feed) => feed.stale),
  };
}

export async function getPartners() {
  return feed(`${base}/partners`, 30, (value): value is NonNullable<Json> => partnerList(value) !== null);
}

export async function getEvent(id: string) {
  for (const path of [`events/${id}`, `${base}/events/${id}`]) {
    try {
      const value = await request(path);
      if (isRow(value) && String(value.id) === id) return value;
      throw new Error("Invalid TruckersMP event");
    } catch (error) {
      if (path === `events/${id}`) continue;
      if (error instanceof UpstreamError && error.status === 404) return null;
      throw error;
    }
  }
  return null;
}
