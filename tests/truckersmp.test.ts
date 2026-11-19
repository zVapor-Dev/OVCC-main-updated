import assert from "node:assert/strict";
import test from "node:test";
import { acceptedPartners, eventView, mergeEvents } from "../lib/truckersmp-data";

test("the calendar merges hosted and attending events in UTC order, preferring hosted duplicates", () => {
  const hosted = { id: 2, name: "Hosted", start_at: "2026-11-20 18:00:00" };
  const attending = { id: 1, start_at: "2026-11-20 17:00:00" };
  assert.deepEqual(
    mergeEvents([
      [null, hosted],
      [{ id: "2", name: "Duplicate" }, {}, attending],
    ]),
    [attending, hosted],
  );
});

test("both partner response formats show the other VTC and exclude pending requests", () => {
  const us = { id: 87827, name: "Orvion" };
  const a = { id: 1, name: "A" },
    b = { id: 2, name: "B" };
  const wrapper = {
    partners: [
      { status: "Accepted", sender: us, receiver: a },
      { status: "Accepted", sender: b, receiver: us },
      { status: "Pending", sender: a, receiver: us },
    ],
  };
  for (const payload of [wrapper, [wrapper]]) {
    assert.deepEqual(
      acceptedPartners(payload).map((p) => p.name),
      ["A", "B"],
    );
  }
});

test("event details preserve TruckersMP permalinks and fall back when optional fields are absent", () => {
  const event = eventView({
    id: 3,
    url: "/events/3-convoy",
    game: { short: "ATS" },
    start_at: "2026-12-01 01:00:00",
    departure: { location: "Depot" },
    destination: { city: "Reno" },
  });
  assert.equal(event.url, "https://truckersmp.com/events/3-convoy");
  assert.equal(event.meetup, event.start);
  assert.equal(event.game, "ATS");
  assert.equal(event.route, "Depot ➔ Reno");
  assert.equal(
    eventView({ id: 3, url: "https://unrelated.example/events/3" }).url,
    "https://truckersmp.com/events/3",
  );
});
