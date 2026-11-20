"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Clock, ExternalLink, MapPin, Server, Tag, X } from "lucide-react";
import { eventView, isRow, type CalendarEvent } from "@/lib/truckersmp-data";
import { KIND_LABELS, SOURCE_LABELS, type CalendarItem, type EntryEvent } from "@/lib/calendar";
import { FallbackImage } from "@/components/fallback-image";

function utc(value: string) {
  return value ? `${value.slice(0, 16).replace("T", " ")} (UTC)` : "TBA";
}

/** Opens the dialog as a modal and locks page scroll while it is mounted. */
function useModal() {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = previous;
    };
  }, []);
  return dialog;
}

export default function EventDialog({ event, onClose }: { event: CalendarItem; onClose: () => void }) {
  return event.source === "TMP" ? (
    <TmpEventDialog event={event} onClose={onClose} />
  ) : (
    <EntryDialog entry={event} onClose={onClose} />
  );
}

function EntryDialog({ entry, onClose }: { entry: EntryEvent; onClose: () => void }) {
  const dialog = useModal();
  const fields = entry.booked
    ? []
    : [
        { label: "Kind", value: KIND_LABELS[entry.kind], Icon: Tag },
        { label: "Location", value: entry.location ?? "TBA", Icon: MapPin },
        { label: "Start", value: utc(entry.start), Icon: Calendar },
        ...(entry.end ? [{ label: "End", value: utc(entry.end), Icon: Clock }] : []),
      ];
  return (
    <dialog
      ref={dialog}
      aria-labelledby="event-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="modal-card m-auto w-[calc(100%-2rem)] max-w-2xl p-0 text-white"
    >
      <div className="space-y-6 p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-xs font-bold text-[#FFBE00]">
              {SOURCE_LABELS[entry.source]}
            </span>
            <h2 id="event-title" className="text-2xl font-bold sm:text-3xl">
              {entry.booked ? "Booked" : entry.title}
            </h2>
          </div>
          <button autoFocus aria-label="Close event details" onClick={onClose} className="rounded-full bg-black/70 p-2">
            <X size={20} />
          </button>
        </div>
        {entry.booked ? (
          <p className="text-sm text-white/60">This is an internal booking. No details are public.</p>
        ) : (
          <>
            <dl className="grid gap-4 sm:grid-cols-2">
              {fields.map(({ label, value, Icon }) => (
                <div key={label} className="flex gap-3 rounded-2xl border border-white/5 bg-[#1c1b22] p-4">
                  <Icon className="mt-1 shrink-0 text-[#FFBE00]" size={18} />
                  <div className="min-w-0">
                    <dt className="text-[10px] font-bold uppercase text-white/50">{label}</dt>
                    <dd className="break-words text-sm font-semibold">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            {entry.description && (
              <p className="whitespace-pre-line break-words text-sm text-white/80">{entry.description}</p>
            )}
            {entry.url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noreferrer noopener"
                className="btn-solid-yellow flex items-center justify-center gap-2 rounded-xl py-3 text-sm"
              >
                <ExternalLink size={16} /> More information
              </a>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}

function TmpEventDialog({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const dialog = useModal();
  const [details, setDetails] = useState(event);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const res = await fetch(`/api/events?id=${encodeURIComponent(event.id)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Event detail unavailable");
        const body = await res.json();
        if (body.error || !isRow(body.response) || String(body.response.id) !== event.id)
          throw new Error("Invalid event detail");
        if (!controller.signal.aborted) setDetails(eventView(body.response));
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    void refresh();
    return () => controller.abort();
  }, [event.id]);

  const fields = [
    { label: "Route", value: details.route, Icon: MapPin },
    { label: "Server", value: details.server, Icon: Server },
    { label: "Meetup", value: utc(details.meetup), Icon: Clock },
    { label: "Departure", value: utc(details.start), Icon: Calendar },
  ];
  return (
    <dialog
      ref={dialog}
      aria-labelledby="event-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="modal-card m-auto w-[calc(100%-2rem)] max-w-3xl p-0 text-white"
    >
      <div>
        <div className="relative h-64 bg-neutral-900 sm:h-80">
          <FallbackImage
            src={details.banner ?? "/ets2_20260804_143045_00.png"}
            fallback="/ets2_20260804_143045_00.png"
            className="h-full w-full object-cover"
            alt="Event banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141318] via-transparent to-black/60" />
          <div className="absolute left-4 top-4 flex gap-2 text-xs font-bold">
            <span className="rounded-full bg-black/70 px-3 py-1 text-[#FFBE00]">{details.game}</span>
            <span className="rounded-full bg-black/70 px-3 py-1">{details.type}</span>
          </div>
          <button
            autoFocus
            aria-label="Close event details"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-black/70 p-2"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-6 p-6 sm:p-8">
          <div className="border-r-4 border-rose-500 pr-3">
            <h2 id="event-title" className="mb-1 text-2xl font-bold sm:text-3xl">
              {details.title}
            </h2>
            <p className="text-sm text-white/60">
              Hosted by <strong className="text-white">{details.host}</strong>
            </p>
          </div>
          {failed && (
            <p role="status" className="text-sm text-amber-300">
              Live details are unavailable. Showing the calendar listing.
            </p>
          )}
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ label, value, Icon }) => (
              <div key={label} className="flex gap-3 rounded-2xl border border-white/5 bg-[#1c1b22] p-4">
                <Icon className="mt-1 shrink-0 text-[#FFBE00]" size={18} />
                <div>
                  <dt className="text-[10px] font-bold uppercase text-white/50">{label}</dt>
                  <dd className="text-sm font-semibold">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
          <a
            href={details.url}
            target="_blank"
            rel="noreferrer"
            className="btn-solid-yellow flex items-center justify-center gap-2 rounded-xl py-3 text-sm"
          >
            <ExternalLink size={16} /> View on TruckersMP
          </a>
          {details.map && (
            <figure className="overflow-hidden rounded-2xl border border-white/10">
              <figcaption className="bg-white/5 p-3 text-center text-xs font-bold uppercase text-[#FFBE00]">
                Konvoi Route / Convoy Route
              </figcaption>
              <img src={details.map} alt="Convoy route map" className="w-full" />
            </figure>
          )}
        </div>
      </div>
    </dialog>
  );
}
