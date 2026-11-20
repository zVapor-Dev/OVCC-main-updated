import { Suspense } from "react";
import { DirectoryMessage, PartnerCards, TeamCards } from "@/components/directory";
import { FallbackImage } from "@/components/fallback-image";
import { DiscordIcon } from "@/components/discord-icon";
import { VtcLive } from "@/components/vtc-live";
import { DISCORD } from "@/lib/site";
import {
  ArrowRight,
  Calendar,
  Camera,
  CircleCheck,
  Clock,
  MapPin,
  MessageSquare,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <FallbackImage
        src="https://i.vgy.me/HSWFsQ.png"
        fallback="/ets2_20260804_141115_00.png"
        alt="Orvion Convoy Control Hero Background"
        className="fixed inset-0 h-full w-full object-cover opacity-60"
      />
      <div className="bottom-blur-overlay" />
      <main className="relative z-10">
        <section className="min-h-screen w-full flex flex-col justify-end px-4 sm:px-6 md:px-12 pb-12 md:pb-20 pt-32">
          <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div className="flex-1 max-w-3xl">
              <div
                className="animate-blur-fade-up flex flex-wrap items-center gap-3 sm:gap-6 mb-4 md:mb-6 text-xs sm:text-sm text-white/90"
                style={{ animationDelay: "300ms" }}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-5 h-5 text-white" />
                  <span>Professional Convoy Control</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/70">
                  <CircleCheck className="w-4 h-4 text-white/70" />
                  <span>TruckersMP Specialist</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/70">
                  <Clock className="w-4 h-4 text-white/70" />
                  <span>24/7 Active Support</span>
                </div>
              </div>

              <h1
                className="animate-blur-fade-up text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight leading-tight mb-4 md:mb-6 text-white"
                style={{ animationDelay: "400ms", letterSpacing: "-0.04em" }}
              >
                Precision in{" "}
                <em className="font-serif-italic font-normal text-gradient-yellow">Every Convoy</em>
              </h1>

              <p
                className="animate-blur-fade-up text-base sm:text-lg md:text-xl text-gray-300 mb-6 md:mb-10 max-w-2xl font-light leading-relaxed"
                style={{ animationDelay: "500ms" }}
              >
                <strong className="text-gradient-yellow font-semibold">Orvion CC</strong> — convoy control &
                media in TruckersMP.
              </p>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <a
                  href={DISCORD}
                  target="_blank"
                  rel="noreferrer"
                  className="animate-blur-fade-up btn-gradient-yellow rounded-full px-6 sm:px-8 py-3 flex items-center gap-2 text-sm md:text-base"
                  style={{ animationDelay: "600ms" }}
                >
                  <DiscordIcon className="w-5 h-5" />
                  <span>Join Our Discord</span>
                </a>

                <a
                  href="/event"
                  className="animate-blur-fade-up rounded-full font-medium liquid-glass text-white hover:bg-white/10 px-6 sm:px-8 py-3 text-sm md:text-base transition-colors"
                  style={{ animationDelay: "700ms" }}
                >
                  <span>Check Availability</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="relative z-20 bg-black py-28 md:py-40 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <span className="text-white/40 text-xs tracking-widest uppercase block mb-4">Who We Are</span>

            <h2 className="text-4xl md:text-6xl lg:text-7xl text-white leading-[1.15] tracking-tight font-light mb-12">
              About{" "}
              <em className="font-serif-italic font-normal text-gradient-yellow">Orvion Convoy Control</em>
            </h2>

            <div className="flex flex-col gap-6 text-white/80 text-lg md:text-xl leading-relaxed font-light max-w-4xl mb-12">
              <p>
                <span className="text-[#FFBE00] font-semibold">Orvion Convoy Control</span> is a rapidly
                growing team providing professional convoy control services within the TruckersMP community.
              </p>
              <p>
                Our team was established to ensure that events run in an organized, safe, and smooth manner;
                we aim to deliver high-standard services in traffic management, convoy control, and event
                support.
              </p>
              <p>
                With our strong team structure, active staff, and commitment to professionalism, we strive to
                contribute to events of all sizes in the best possible way.
              </p>
              <p>
                Our vision as <span className="text-[#FFBE00] font-semibold">Orvion Convoy Control</span> is
                to become a respected team representing reliability, discipline, and quality, while
                continuously improving ourselves.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-16">
              <a
                href={DISCORD}
                target="_blank"
                rel="noreferrer"
                className="rounded-full btn-solid-yellow px-8 py-3.5 text-sm flex items-center gap-2"
              >
                <DiscordIcon className="w-4 h-4" />
                <span>Join Discord</span>
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="hyper-card bg-[#0d0c0c] p-8 text-center">
                <div className="text-5xl font-serif font-bold text-white mb-2">24/7</div>
                <div className="text-white/60 text-xs uppercase tracking-widest font-medium">
                  Community Support
                </div>
              </div>
              <div className="hyper-card bg-[#0d0c0c] p-8 text-center">
                <div className="text-5xl font-serif font-bold text-white mb-2">CC</div>
                <div className="text-white/60 text-xs uppercase tracking-widest font-medium">
                  Event Control
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="team" className="relative z-20 bg-black py-28 md:py-40 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <span className="text-white/40 text-xs tracking-widest uppercase block mb-4">
              ✦ The People Behind Orvion
            </span>

            <h2 className="text-4xl md:text-6xl lg:text-7xl text-white leading-[1.15] tracking-tight font-light mb-16">
              Meet Our <em className="font-serif-italic font-normal text-gradient-yellow">Team</em>
            </h2>

            <div id="teamContainer" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              <Suspense fallback={<DirectoryMessage>Loading…</DirectoryMessage>}>
                <TeamCards />
              </Suspense>
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <VtcLive />
        </Suspense>

        <section id="offers" className="relative z-20 bg-black py-28 md:py-40 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <span className="text-white/40 text-xs tracking-widest uppercase block mb-3">
                What We Offer
              </span>
              <h2 className="text-4xl md:text-6xl text-white tracking-tight font-light">
                Our <span className="font-bold">Services</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 hyper-card p-8 min-h-[300px] flex flex-col justify-between">
                <div className="relative z-10 max-w-md">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FFBE00] mb-6">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">
                    Professional Convoy Control
                  </h3>
                  <p className="text-white/60 text-sm font-light leading-relaxed mb-6">
                    Managing roads, junctions and convoy flow to keep every event safe and organized.
                  </p>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#FFBE00] transition-colors"
                  >
                    <span>See More</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="md:col-span-5 hyper-card p-8 min-h-[300px] flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FFBE00] mb-6">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">Route Management</h3>
                  <p className="text-white/60 text-sm font-light leading-relaxed mb-6">
                    Supporting lead, tail and control positions with clear coordination across the full route.
                  </p>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#FFBE00] transition-colors"
                  >
                    <span>See More</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="md:col-span-4 hyper-card p-8 min-h-[300px] flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FFBE00] mb-6">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">Media Services</h3>
                  <p className="text-white/60 text-sm font-light leading-relaxed mb-6">
                    Capturing professional convoy photography, video highlights, and full media coverage for
                    TruckersMP events.
                  </p>
                  <a
                    href={DISCORD}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#FFBE00] transition-colors"
                  >
                    <span>See More</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="md:col-span-3 hyper-card p-6 min-h-[300px] flex flex-col justify-between text-center group">
                <FallbackImage
                  fallback="/ets2_20260804_141035_00.png"
                  src="https://i.vgy.me/5ZOzSb.png"
                  alt="Orvion Everything In One Place"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-75 contrast-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

                <div className="relative z-10 my-auto">
                  <h3 className="text-2xl font-serif italic text-white mb-2">Everything</h3>
                  <p className="text-lg font-bold text-white uppercase tracking-wider">in One Place</p>
                </div>
              </div>

              <div className="md:col-span-5 hyper-card p-8 min-h-[300px] flex flex-col justify-between">
                <div className="relative z-10 max-w-xs">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FFBE00] mb-6">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">
                    Partnership Support
                  </h3>
                  <p className="text-white/60 text-sm font-light leading-relaxed mb-6">
                    Giving priority support to our partners and building long-term event cooperation.
                  </p>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#FFBE00] transition-colors"
                  >
                    <span>See More</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="partners"
          className="relative z-20 bg-black py-28 md:py-40 px-6 border-t border-white/10"
        >
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16">
              <div>
                <span className="text-white/40 text-xs tracking-widest uppercase block mb-3">
                  ✦ Official Network
                </span>
                <h2 className="text-3xl md:text-5xl text-white tracking-tight font-light">
                  Our <span className="font-bold">Partners</span>
                </h2>
              </div>
              <div>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FFBE00] text-black font-bold text-xs uppercase tracking-wider hover:bg-yellow-400 transition-all"
                >
                  <DiscordIcon className="w-4 h-4" />
                  <span>Become Our Partner</span>
                </a>
              </div>
            </div>

            <div id="partnersContainer" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Suspense fallback={<DirectoryMessage>Loading…</DirectoryMessage>}>
                <PartnerCards />
              </Suspense>
            </div>
          </div>
        </section>

        <section id="faq" className="relative z-20 bg-black py-28 md:py-40 px-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <div className="mb-16">
              <span className="text-white/40 text-xs tracking-widest uppercase block mb-3">
                Got Questions?
              </span>
              <h2 className="text-4xl md:text-6xl text-white tracking-tight mb-4 font-light">
                Frequently Asked <span className="font-bold">Questions</span>
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <details
                name="faq"
                className="group cursor-pointer bg-[#0d0c0c] border border-white/5 rounded-2xl hover:border-white/20 transition-all"
              >
                <summary className="p-6 flex items-center justify-between font-semibold text-lg text-white">
                  <span>1. How do I request convoy control for an upcoming event?</span>
                  <Plus className="group-open:rotate-45 w-5 h-5 text-white transition-transform" />
                </summary>
                <p className="pb-5 px-6 text-white/60 text-sm leading-relaxed font-light">
                  Join our Discord server and open a ticket under Event Supervision. Provide your event date,
                  route map, and expected player count.
                </p>
              </details>

              <details
                name="faq"
                className="group cursor-pointer bg-[#0d0c0c] border border-white/5 rounded-2xl hover:border-white/20 transition-all"
              >
                <summary className="p-6 flex items-center justify-between font-semibold text-lg text-white">
                  <span>2. What games and servers does Orvion CC support?</span>
                  <Plus className="group-open:rotate-45 w-5 h-5 text-white transition-transform" />
                </summary>
                <p className="pb-5 px-6 text-white/60 text-sm leading-relaxed font-light">
                  We support Euro Truck Simulator 2 (ETS2) and American Truck Simulator (ATS) across all
                  official SCS Multiplayer and TruckersMP servers.
                </p>
              </details>

              <details
                name="faq"
                className="group cursor-pointer bg-[#0d0c0c] border border-white/5 rounded-2xl hover:border-white/20 transition-all"
              >
                <summary className="p-6 flex items-center justify-between font-semibold text-lg text-white">
                  <span>3. How do I apply for the CC Recruitment team?</span>
                  <Plus className="group-open:rotate-45 w-5 h-5 text-white transition-transform" />
                </summary>
                <p className="pb-5 px-6 text-white/60 text-sm leading-relaxed font-light">
                  We welcome active CC! Submit your application in our discord!
                </p>
              </details>
            </div>
          </div>
        </section>

        <section id="contact" className="relative z-20 bg-black py-28 md:py-40 px-6 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16">
              <span className="text-white/40 text-xs tracking-widest uppercase block mb-3">Get In Touch</span>
              <h2 className="text-4xl md:text-6xl text-white font-light tracking-tight mb-4">
                Contact <span className="font-bold">Us</span>
              </h2>
              <p className="text-white/60 text-sm md:text-base font-light max-w-xl">
                Join our Discord server to request convoy control, apply for partnership or become a member of
                Orvion CC.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="hyper-card hyper-card-gold p-8 flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FFBE00] mb-4">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Discord Ticket Hub</h3>
                  <p className="text-white/50 text-sm font-light leading-relaxed mb-6">
                    Open a ticket in our Discord server for support, partnership, or event supervision
                    requests.
                  </p>
                </div>
                <a
                  href={DISCORD}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-gradient-yellow rounded-full py-3 px-6 text-center text-sm relative z-10"
                >
                  Open Discord
                </a>
              </div>

              <div className="hyper-card hyper-card-gold p-8 flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FFBE00] mb-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">CC Recruitment</h3>
                  <p className="text-white/50 text-sm font-light leading-relaxed mb-6">
                    Interested in joining our CC team? Submit your application and become part of Orvion.
                  </p>
                </div>
                <a
                  href={DISCORD}
                  target="_blank"
                  rel="noreferrer"
                  className="liquid-glass rounded-full py-3 px-6 text-center text-white text-sm font-medium hover:bg-white/10 transition-colors relative z-10"
                >
                  Join CC Team
                </a>
              </div>

              <div className="hyper-card hyper-card-gold p-8 flex flex-col justify-between">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#FFBE00] mb-4">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Event Requests</h3>
                  <p className="text-white/50 text-sm font-light leading-relaxed mb-6">
                    Contact our management team to request convoy control support for your upcoming events.
                  </p>
                </div>
                <a
                  href={DISCORD}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-gradient-yellow rounded-full py-3 px-6 text-center text-sm relative z-10"
                >
                  Request Event CC
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
