import { Calendar, House, LifeBuoy, MapPin, ShieldAlert, Truck } from "lucide-react";
import { DISCORD } from "@/lib/site";

export const metadata = { title: "404 - Off Route | Orvion Convoy Control" };

export default function NotFound() {
  return (
    <div className="off-route relative flex min-h-screen items-center">
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pt-36 pb-20 max-w-5xl mx-auto w-full">
        <div className="w-full text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFBE00]/10 border border-[#FFBE00]/30 text-[#FFBE00] text-xs font-bold uppercase tracking-widest mb-6">
            <ShieldAlert className="w-4 h-4" />
            <span>Error 404 — Route Not Found</span>
          </div>

          <h1 className="font-display text-8xl sm:text-9xl md:text-[140px] font-black leading-none tracking-tight text-gradient-yellow mb-4 select-none">
            404
          </h1>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            You've Taken a <span className="text-[#FFBE00]">Wrong Exit</span>
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-white/60 max-w-xl leading-relaxed mb-10 font-light">
            The route or page you are looking for has been moved, renamed, or doesn't exist on the Orvion
            Convoy Control network. Let's get you back on track!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-md">
            <a
              href="/"
              className="btn-solid-yellow rounded-full px-8 py-3.5 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
            >
              <House className="w-4 h-4" />
              <span>Return Home</span>
            </a>
            <a
              href="/event"
              className="liquid-glass rounded-full px-8 py-3.5 flex items-center justify-center gap-2 text-sm sm:text-base text-white hover:bg-white/10 transition-colors border border-white/10 w-full sm:w-auto"
            >
              <Calendar className="w-4 h-4 text-[#FFBE00]" />
              <span>Events Calendar</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 w-full text-left">
            <a href="/" className="hyper-card p-6 block">
              <div className="w-10 h-10 rounded-xl bg-[#FFBE00]/10 flex items-center justify-center text-[#FFBE00] mb-4">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Homepage</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Explore our CC services, team information, and partners.
              </p>
            </a>

            <a href="/event" className="hyper-card p-6 block">
              <div className="w-10 h-10 rounded-xl bg-[#FFBE00]/10 flex items-center justify-center text-[#FFBE00] mb-4">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Events & Convoys</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                View all upcoming TruckersMP events Orvion CC is attending.
              </p>
            </a>

            <a href={DISCORD} target="_blank" rel="noopener noreferrer" className="hyper-card p-6 block">
              <div className="w-10 h-10 rounded-xl bg-[#FFBE00]/10 flex items-center justify-center text-[#FFBE00] mb-4">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Support Discord</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Join our Discord server to open a support or event ticket.
              </p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
