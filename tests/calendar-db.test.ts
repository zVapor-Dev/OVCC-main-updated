import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { getCalendarEntries } from "../lib/calendar-db";

const originalEnv = {
  POSTGRES_ENABLED: process.env.POSTGRES_ENABLED,
  DATABASE_URL: process.env.DATABASE_URL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const none = { entries: [], toggles: { botEvents: false, manualEvents: false } };

test("calendar entries disappear silently when PostgreSQL is disabled", async () => {
  process.env.POSTGRES_ENABLED = "false";
  process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
  assert.deepEqual(await getCalendarEntries(["1"]), none);
});

test("a database error does not break the calendar", async (t) => {
  t.mock.method(console, "error", () => {});
  process.env.POSTGRES_ENABLED = "true";
  process.env.DATABASE_URL = "postgresql://unused:unused@127.0.0.1:1/unused";
  assert.deepEqual(await getCalendarEntries([]), none);
  delete process.env.DATABASE_URL;
  assert.deepEqual(await getCalendarEntries([]), none);
});
