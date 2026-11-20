import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarWindow,
  entryView,
  isEntry,
  isEntryId,
  mergeCalendar,
  parseEntryForm,
  parseUtc,
  visibleEntries,
  type EntryRow,
} from "../lib/calendar";
import { eventView } from "../lib/truckersmp-data";

const now = new Date("2026-11-20T12:00:00Z");
const on = { botEvents: true, manualEvents: true };

function row(overrides: Partial<EntryRow> = {}): EntryRow {
  return {
    id: "ckentry0001",
    source: "MANUAL",
    kind: "MEETING",
    title: "Staff meeting",
    description: null,
    startAt: new Date("2026-11-25T19:00:00Z"),
    endAt: null,
    location: null,
    url: null,
    public: true,
    cancelled: false,
    tmpEventId: null,
    ...overrides,
  };
}

test("each source only shows when its feature toggle is on", () => {
  const rows = [row({ id: "manual00001" }), row({ id: "botpanel001", source: "BOT_PANEL" })];
  const ids = (toggles: typeof on) => visibleEntries(rows, toggles, [], now).map((e) => e.id);
  assert.deepEqual(ids(on), ["entry-manual00001", "entry-botpanel001"]);
  assert.deepEqual(ids({ botEvents: false, manualEvents: true }), ["entry-manual00001"]);
  assert.deepEqual(ids({ botEvents: true, manualEvents: false }), ["entry-botpanel001"]);
  assert.deepEqual(ids({ botEvents: false, manualEvents: false }), []);
});

test("cancelled entries and entries outside the window are skipped", () => {
  const { from, to } = calendarWindow(now);
  const rows = [
    row({ id: "cancelled01", cancelled: true }),
    row({ id: "tooold00001", startAt: new Date(from.getTime() - 1) }),
    row({ id: "toofar00001", startAt: new Date(to.getTime() + 1) }),
    row({ id: "oldedge0001", startAt: from }),
    row({ id: "invalid0001", startAt: new Date("nope") }),
  ];
  assert.deepEqual(
    visibleEntries(rows, on, [], now).map((e) => e.id),
    ["entry-oldedge0001"],
  );
});

test("a bot panel for a TMP event already shown is not shown twice", () => {
  const rows = [
    row({ id: "panel000001", source: "BOT_PANEL", tmpEventId: 42 }),
    row({ id: "panel000002", source: "BOT_PANEL", tmpEventId: 43 }),
    // Manual entries are never deduplicated, even with a tmpEventId.
    row({ id: "manual00001", tmpEventId: 42 }),
  ];
  assert.deepEqual(
    visibleEntries(rows, on, ["42", 7], now).map((e) => e.id),
    ["entry-panel000002", "entry-manual00001"],
  );
});

test("non-public entries only expose their time slot as Booked", () => {
  const booked = entryView(
    row({ public: false, title: "Secret", description: "Hidden", location: "Hidden", url: "https://x.test" }),
  );
  assert.deepEqual(booked, {
    id: "entry-ckentry0001",
    source: "MANUAL",
    start: "2026-11-25 19:00:00",
    end: null,
    booked: true,
    title: "Booked",
  });
  assert.ok(!JSON.stringify(booked).includes("Secret"));
  assert.ok(!JSON.stringify(booked).includes("Hidden"));
});

test("public entries keep only web links", () => {
  assert.equal((entryView(row({ url: "https://orvion.example/a" })) as { url: string }).url, "https://orvion.example/a");
  assert.equal((entryView(row({ url: "javascript:alert(1)" })) as { url: null }).url, null);
  const view = entryView(row({ endAt: new Date("2026-11-25T20:30:00Z"), location: "" }));
  assert.equal(view.end, "2026-11-25 20:30:00");
  assert.equal(view.booked === false && view.location, null);
});

test("TMP events and entries merge in start order, TMP first on a tie", () => {
  const tmp = eventView({ id: 5, name: "TMP", start_at: "2026-11-25 19:00:00" });
  const early = entryView(row({ id: "early000001", startAt: new Date("2026-11-24T10:00:00Z") }));
  const tie = entryView(row({ id: "tie00000001" }));
  const merged = mergeCalendar([tmp], [tie, early]);
  assert.deepEqual(
    merged.map((item) => item.id),
    ["entry-early000001", "5", "entry-tie00000001"],
  );
  assert.equal(merged[1].source, "TMP");
  assert.deepEqual(merged.map(isEntry), [true, false, true]);
});

function form(values: Record<string, string>) {
  const data = new FormData();
  const base = { kind: "MEETING", title: "Meeting", startDate: "2026-12-01", startTime: "18:00" };
  for (const [key, value] of Object.entries({ ...base, ...values })) data.set(key, value);
  return data;
}

test("the entry form parses valid input as UTC", () => {
  const result = parseEntryForm(
    form({ title: "  Meeting  ", endTime: "19:30", url: "https://discord.gg/x", public: "on", location: "VC" }),
  );
  assert.ok(result.ok);
  assert.equal(result.value.title, "Meeting");
  assert.equal(result.value.startAt.toISOString(), "2026-12-01T18:00:00.000Z");
  assert.equal(result.value.endAt?.toISOString(), "2026-12-01T19:30:00.000Z");
  assert.equal(result.value.public, true);
  assert.equal(result.value.description, null);
  const unticked = parseEntryForm(form({}));
  assert.ok(unticked.ok && unticked.value.public === false && unticked.value.endAt === null);
});

test("the entry form rejects invalid input", () => {
  const cases: Record<string, string>[] = [
    { kind: "PARTY" },
    { title: "   " },
    { title: "x".repeat(121) },
    { description: "x".repeat(2001) },
    { location: "x".repeat(121) },
    { url: "javascript:alert(1)" },
    { url: "ftp://example.com" },
    { url: "not a url" },
    { startDate: "2026-02-30" },
    { startTime: "25:00" },
    { startDate: "" },
    { endDate: "2026-12-02" },
    { endDate: "2026-11-30", endTime: "10:00" },
    { endTime: "17:59" },
  ];
  for (const values of cases) {
    const result = parseEntryForm(form(values));
    assert.equal(result.ok, false, JSON.stringify(values));
  }
  assert.ok(parseEntryForm(form({ title: "x".repeat(120), endTime: "18:00" })).ok);
});

test("UTC parsing and id checks reject malformed values", () => {
  assert.equal(parseUtc("2026-12-01", "18:00")?.toISOString(), "2026-12-01T18:00:00.000Z");
  assert.equal(parseUtc("2026-13-01", "18:00"), null);
  assert.equal(parseUtc("2026-12-01T18:00", "18:00"), null);
  assert.ok(isEntryId("cmabc123def456"));
  assert.ok(!isEntryId("../etc"));
  assert.ok(!isEntryId(null));
});
