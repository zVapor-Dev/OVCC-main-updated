import { Suspense } from "react";
import { FallbackImage } from "@/components/fallback-image";
import { SITE_NAME } from "@/lib/site";
import { getEvents } from "@/lib/truckersmp";
import { eventView } from "@/lib/truckersmp-data";
import Calendar from "./calendar";
import "./calendar.css";

const title = `Events & Calendar — ${SITE_NAME}`;
const description =
  "Check event availability and view the official TruckersMP convoy calendar for Orvion Convoy Control (VTC 87827). Timezone: UTC.";
const image = "https://i.vgy.me/XmPJ6F.png";
export const metadata = {
  title,
  description,
  openGraph: { type: "website", siteName: SITE_NAME, title, description, images: [image] },
  twitter: { card: "summary_large_image", title, description, images: [image] },
};
export const dynamic = "force-dynamic";

async function EventCalendar() {
  let feed;
  try {
    feed = await getEvents();
  } catch (error) {
    console.error("Event calendar unavailable", error);
    return (
      <p className="py-16 text-center" role="status">
        The event calendar is unavailable. Please try again later.
      </p>
    );
  }
  const events = feed.response.map(eventView).filter((event) => /^\d{4}-\d{2}-\d{2}/.test(event.start));
  return (
    <>
      {feed.partial && (
        <p role="status" className="mb-4 text-amber-300">
          One TruckersMP feed is unavailable. Some bookings may be missing.
        </p>
      )}
      {feed.stale && (
        <p role="status" className="mb-4 text-amber-300">
          TruckersMP is unavailable. Some bookings are from the last saved calendar.
        </p>
      )}
      <Calendar events={events} initialMonth={(events[0]?.start ?? new Date().toISOString()).slice(0, 7)} />
    </>
  );
}

export default function EventsPage() {
  return (
    <main>
      <section className="events-hero">
        <FallbackImage src={image} fallback="/bannerv.png" alt="Orvion Convoy Control Events" />
        <div className="events-hero-overlay" />
        <div className="events-hero-content px-4">
          <h1 className="mb-3 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Check <span className="text-[#FFBE00]">Availability</span>
          </h1>
          <p className="max-w-xl text-sm text-white/60 sm:text-base">
            All convoys Orvion CC is attending — updated as we mark our attendance on TruckersMP.
          </p>
        </div>
      </section>
      <section aria-label="Convoy calendar" className="mx-auto max-w-7xl px-4 pb-24 pt-12 sm:px-6 md:px-12">
        <div className="cal-container p-4 sm:p-8">
          <Suspense
            fallback={
              <p role="status" className="py-16 text-center">
                Loading the convoy calendar…
              </p>
            }
          >
            <EventCalendar />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
