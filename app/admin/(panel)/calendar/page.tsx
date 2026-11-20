import Link from "next/link";
import type { CalendarEntry } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin-auth";
import { ENTRY_KINDS, isEntryId, KIND_LABELS, LIMITS, SOURCE_LABELS, WINDOW_PAST_DAYS } from "@/lib/calendar";
import { db } from "@/lib/db";
import { getFeatures } from "@/lib/features";
import { createEntry, deleteEntry, setEntryCancelled, setEntryPublic, updateEntry } from "./actions";

const input =
  "w-full rounded-xl border border-white/10 bg-black px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#FFBE00] focus:outline-none";
const label = "mb-1 block text-xs font-bold uppercase tracking-wide text-white/50";
const smallButton = "rounded-xl border border-white/10 px-3 py-1.5 text-xs hover:text-[#FFBE00]";

const stamp = (date: Date) => date.toISOString().slice(0, 16).replace("T", " ");

function EntryForm({ entry }: { entry?: CalendarEntry }) {
  const date = (value?: Date | null) => value?.toISOString().slice(0, 10) ?? "";
  const time = (value?: Date | null) => value?.toISOString().slice(11, 16) ?? "";
  return (
    <form action={entry ? updateEntry : createEntry} className="grid gap-4 sm:grid-cols-2">
      {entry && <input type="hidden" name="id" value={entry.id} />}
      <div className="sm:col-span-2">
        <label className={label} htmlFor="title">
          Title
        </label>
        <input id="title" name="title" required maxLength={LIMITS.title} defaultValue={entry?.title} className={input} />
      </div>
      <div>
        <label className={label} htmlFor="kind">
          Kind
        </label>
        <select id="kind" name="kind" defaultValue={entry?.kind ?? "MEETING"} className={input}>
          {ENTRY_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={label} htmlFor="location">
          Location (optional)
        </label>
        <input
          id="location"
          name="location"
          maxLength={LIMITS.location}
          defaultValue={entry?.location ?? ""}
          placeholder="e.g. Discord voice, Simulation 1"
          className={input}
        />
      </div>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className={label}>Start (UTC)</legend>
        <input aria-label="Start date" type="date" name="startDate" required defaultValue={date(entry?.startAt)} className={input} />
        <input aria-label="Start time" type="time" name="startTime" required defaultValue={time(entry?.startAt)} className={input} />
      </fieldset>
      <fieldset className="grid grid-cols-2 gap-2">
        <legend className={label}>End (UTC, optional)</legend>
        <input aria-label="End date" type="date" name="endDate" defaultValue={date(entry?.endAt)} className={input} />
        <input aria-label="End time" type="time" name="endTime" defaultValue={time(entry?.endAt)} className={input} />
      </fieldset>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="url">
          Link (optional)
        </label>
        <input
          id="url"
          name="url"
          type="url"
          maxLength={LIMITS.url}
          defaultValue={entry?.url ?? ""}
          placeholder="https://"
          className={input}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={label} htmlFor="description">
          Description (optional, plain text)
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          maxLength={LIMITS.description}
          defaultValue={entry?.description ?? ""}
          className={input}
        />
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" name="public" defaultChecked={entry?.public ?? true} className="accent-[#FFBE00]" />
        Public: show title and details on /event. Unticked, the slot shows as &quot;Booked&quot;.
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button className="rounded-xl bg-[#FFBE00] px-4 py-2 text-sm font-semibold text-black">
          {entry ? "Save changes" : "Add entry"}
        </button>
        {entry && (
          <Link href="/admin/calendar" className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/70">
            Cancel editing
          </Link>
        )}
      </div>
    </form>
  );
}

function EntryRow({ entry }: { entry: CalendarEntry }) {
  const manual = entry.source === "MANUAL";
  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 ${
        entry.cancelled ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 font-semibold">
          <i className={`h-2 w-2 rounded-full ${manual ? "bg-emerald-400" : "bg-sky-400"}`} aria-hidden />
          <span className={`break-words ${entry.cancelled ? "line-through" : ""}`}>{entry.title}</span>
          {entry.cancelled && <span className="rounded-full bg-rose-500/20 px-2 text-xs text-rose-300">Cancelled</span>}
          {!entry.public && <span className="rounded-full bg-white/10 px-2 text-xs text-white/70">Booked only</span>}
        </p>
        <p className="text-sm text-white/60">
          {stamp(entry.startAt)}
          {entry.endAt && ` – ${stamp(entry.endAt)}`} UTC · {KIND_LABELS[entry.kind]}
          {entry.location && ` · ${entry.location}`}
        </p>
        <p className="text-xs text-white/40">
          {SOURCE_LABELS[entry.source]}
          {entry.tmpEventId != null && ` · TMP event ${entry.tmpEventId}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {manual && (
          <Link href={`/admin/calendar?edit=${entry.id}`} className={smallButton}>
            Edit
          </Link>
        )}
        <form action={setEntryPublic}>
          <input type="hidden" name="id" value={entry.id} />
          <input type="hidden" name="public" value={String(!entry.public)} />
          <button className={smallButton}>{entry.public ? "Make Booked only" : "Make public"}</button>
        </form>
        {(manual || !entry.cancelled) && (
          <form action={setEntryCancelled}>
            <input type="hidden" name="id" value={entry.id} />
            <input type="hidden" name="cancelled" value={String(!entry.cancelled)} />
            <button className={smallButton}>{entry.cancelled ? "Uncancel" : "Cancel"}</button>
          </form>
        )}
        {manual && (
          <details className="relative">
            <summary className={`${smallButton} cursor-pointer list-none text-rose-300`}>Delete</summary>
            <form
              action={deleteEntry}
              className="absolute right-0 z-10 mt-2 w-56 rounded-2xl border border-white/10 bg-black p-3 text-xs"
            >
              <input type="hidden" name="id" value={entry.id} />
              <p className="mb-2 text-white/70">Delete this entry for good?</p>
              <button className="rounded-xl bg-rose-500 px-3 py-1.5 font-semibold text-white">Delete</button>
            </form>
          </details>
        )}
      </div>
    </li>
  );
}

function EntryList({ title, entries, empty }: { title: string; entries: CalendarEntry[]; empty: string }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      <ul className="space-y-3">
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} />
        ))}
        {entries.length === 0 && <li className="text-sm text-white/60">{empty}</li>}
      </ul>
    </section>
  );
}

export default async function CalendarAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const editId = one("edit");
  const error = one("error")?.slice(0, 200);
  const notice = one("notice")?.slice(0, 200);

  const now = new Date();
  const recentFrom = new Date(now.getTime() - WINDOW_PAST_DAYS * 86_400_000);
  const [features, upcoming, recent, editing] = await Promise.all([
    getFeatures(),
    db().calendarEntry.findMany({ where: { startAt: { gte: now } }, orderBy: { startAt: "asc" }, take: 200 }),
    db().calendarEntry.findMany({
      where: { startAt: { gte: recentFrom, lt: now } },
      orderBy: { startAt: "desc" },
      take: 100,
    }),
    isEntryId(editId)
      ? db().calendarEntry.findFirst({ where: { id: editId, source: "MANUAL" } })
      : null,
  ]);

  const status = (on: boolean) => (on ? "text-emerald-300" : "text-white/40");
  return (
    <section>
      <h1 className="mb-2 text-2xl font-extrabold">Calendar</h1>
      <p className="mb-2 text-sm text-white/60">
        Meetings and internal convoys for /event. TruckersMP events show there automatically. All times are UTC.
      </p>
      <p className="mb-6 text-sm text-white/60">
        On /event: manual entries are{" "}
        <strong className={status(features["calendar.manualEvents"])}>
          {features["calendar.manualEvents"] ? "shown" : "hidden"}
        </strong>
        , bot entries are{" "}
        <strong className={status(features["calendar.botEvents"])}>
          {features["calendar.botEvents"] ? "shown" : "hidden"}
        </strong>
        .{" "}
        <Link href="/admin" className="text-[#FFBE00] hover:underline">
          Change on Features
        </Link>
      </p>

      {error && (
        <p role="alert" className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {error}
        </p>
      )}
      {notice && !error && (
        <p role="status" className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          {notice}
        </p>
      )}

      <section className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-bold">{editing ? `Edit “${editing.title}”` : "Add an entry"}</h2>
        <EntryForm key={editing?.id ?? "new"} entry={editing ?? undefined} />
      </section>

      <EntryList title="Upcoming" entries={upcoming} empty="No upcoming entries." />
      <EntryList title={`Last ${WINDOW_PAST_DAYS} days`} entries={recent} empty="Nothing in the last 60 days." />
    </section>
  );
}
