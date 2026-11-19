import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { db, getTeam, postgresEnabled } from "../lib/db";
import { getEvent, getEvents, getPartners } from "../lib/truckersmp";

const originalEnv = {
  POSTGRES_ENABLED: process.env.POSTGRES_ENABLED,
  DATABASE_URL: process.env.DATABASE_URL,
};

beforeEach(() => {
  delete process.env.POSTGRES_ENABLED;
  delete process.env.DATABASE_URL;
});

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test("PostgreSQL stays enabled by default and configuration errors do not silently disable it", async () => {
  for (const value of [undefined, "true"]) {
    if (value === undefined) delete process.env.POSTGRES_ENABLED;
    else process.env.POSTGRES_ENABLED = value;
    assert.equal(postgresEnabled(), true);
    await assert.rejects(getTeam(), /DATABASE_URL is not configured/);
    await assert.rejects(getPartners(), /DATABASE_URL is not configured/);
  }
  process.env.POSTGRES_ENABLED = "invalid";
  await assert.rejects(getTeam(), /POSTGRES_ENABLED must be true or false/);
  await assert.rejects(getPartners(), /POSTGRES_ENABLED must be true or false/);
});

test("disabled PostgreSQL serves the original roster and prevents database access even with a URL", async () => {
  process.env.POSTGRES_ENABLED = "false";
  process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
  assert.throws(() => db(), /PostgreSQL is disabled/);
  const members = await getTeam();
  assert.equal(members.length, 1);
  assert.equal(members[0].handle, "m1dwave");
  assert.equal(members[0].role, "Founder");
});

test("disabled PostgreSQL fetches and merges live feeds on every request without a database URL", async (t) => {
  process.env.POSTGRES_ENABLED = "false";
  const hosted = { id: 2, name: "Hosted", start_at: "2026-11-20 18:00:00" };
  const attending = { id: 1, start_at: "2026-11-20 17:00:00" };
  const partners = { partners: [] };
  const responses: Record<string, unknown> = {
    "https://api.truckersmp.com/v2/vtc/87827/events": [hosted],
    "https://api.truckersmp.com/v2/vtc/87827/events/attending": [attending, { id: 2 }],
    "https://api.truckersmp.com/v2/vtc/87827/partners": partners,
    "https://api.truckersmp.com/v2/events/2": hosted,
  };
  const fetchMock = t.mock.method(globalThis, "fetch", async (url: string) => {
    assert.ok(Object.hasOwn(responses, url), `Unexpected request: ${url}`);
    return Response.json({ error: false, response: responses[url] });
  });
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(await getEvents(), { response: [attending, hosted], partial: false, stale: false });
    assert.deepEqual(await getPartners(), { value: partners, stale: false });
  }
  assert.deepEqual(await getEvent("2"), hosted);
  assert.equal(fetchMock.mock.callCount(), 7);
});

test("database-free feeds report upstream failures instead of returning empty or previously fetched data", async (t) => {
  process.env.POSTGRES_ENABLED = "false";
  let unavailable = false;
  t.mock.method(globalThis, "fetch", async (url: string) =>
    unavailable
      ? new Response(null, { status: 503 })
      : Response.json({ error: false, response: url.endsWith("/partners") ? { partners: [] } : [] }),
  );
  await getEvents();
  await getPartners();
  unavailable = true;
  await assert.rejects(getEvents(), /Neither TruckersMP event feed is available/);
  await assert.rejects(getPartners(), /TruckersMP returned HTTP 503/);
});

test("database-free feeds still reject malformed upstream responses", async (t) => {
  process.env.POSTGRES_ENABLED = "false";
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ error: false, response: { unexpected: true } }),
  );
  await assert.rejects(getEvents(), /Neither TruckersMP event feed is available/);
  await assert.rejects(getPartners(), /Unexpected TruckersMP feed format/);
});
