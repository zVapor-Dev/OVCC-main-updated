"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarEvent } from "@/lib/truckersmp-data";
import EventDialog from "./event-dialog";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthFormat = new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" });

export default function Calendar({
  events,
  initialMonth,
}: {
  events: CalendarEvent[];
  initialMonth: string;
}) {
  const [month, setMonth] = useState(() => new Date(`${initialMonth}-01T00:00:00Z`));
  const [selected, select] = useState<CalendarEvent | null>(null);
  const year = month.getUTCFullYear(),
    index = month.getUTCMonth();
  const offset = (month.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
  const size = offset + days > 35 ? 42 : 35;
  const changeMonth = (step: number) => setMonth(new Date(Date.UTC(year, index + step, 1)));
  const control = "rounded-2xl border border-white/10 bg-white/5 p-2 text-white/70 hover:text-[#FFBE00]";

  return (
    <>
      <div className="mb-8 flex items-center justify-between px-2">
        <button aria-label="Previous month" onClick={() => changeMonth(-1)} className={control}>
          <ChevronLeft />
        </button>
        <h2 aria-live="polite" className="text-2xl font-extrabold tracking-tight sm:text-4xl">
          <span className="text-[#FFBE00]">{monthFormat.format(month)}</span> {year}
        </h2>
        <button aria-label="Next month" onClick={() => changeMonth(1)} className={control}>
          <ChevronRight />
        </button>
      </div>
      {events.length === 0 && <p className="mb-4 text-center text-sm text-white/60">No events scheduled.</p>}
      <div className="overflow-x-auto">
        <div className="min-w-[34rem]">
          <div className="mb-4 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-widest text-[#FFBE00]/70">
            {weekdays.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {Array.from({ length: size }, (_, i) => {
              const date = new Date(Date.UTC(year, index, 1 - offset + i));
              const key = date.toISOString().slice(0, 10);
              const inMonth = date.getUTCMonth() === index;
              const bookings = inMonth ? events.filter((e) => e.start.startsWith(key)) : [];
              return (
                <div
                  key={key}
                  className={`cal-cell min-w-0 ${!inMonth ? "cell-empty" : bookings.length ? "cell-unavailable" : "cell-normal"}`}
                >
                  <div className="flex items-center justify-between text-xs font-bold sm:text-sm">
                    <time dateTime={key}>{date.getUTCDate()}</time>
                    {bookings.length > 0 && (
                      <span className="rounded-full bg-black/50 px-1.5 text-[10px]">{bookings.length}</span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {bookings.map((event) => (
                      <button
                        key={event.id}
                        title={event.title}
                        className="event-pill block w-full text-left"
                        onClick={() => select(event)}
                      >
                        <strong className="text-white">{event.start.slice(11, 16)}</strong> {event.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-white/10 pt-6 text-xs text-white/60">
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full border border-white/50 bg-black" />
          Available
        </span>
        <span className="flex items-center gap-2">
          <i className="h-3 w-3 rounded-full bg-rose-500" />
          Unavailable
        </span>
        <span>All times UTC</span>
      </div>
      {selected && <EventDialog key={selected.id} event={selected} onClose={() => select(null)} />}
    </>
  );
}
