import { BadgeCheck, ExternalLink } from "lucide-react";
import { getLiveVtc } from "@/lib/tmp-live";
import { FallbackImage } from "./fallback-image";

/** Homepage section with live TruckersMP data. Renders nothing when tmp.liveData is off or on any failure. */
export async function VtcLive() {
  let data;
  try {
    data = await getLiveVtc();
  } catch (error) {
    console.error("Live TruckersMP data unavailable", error);
    return null;
  }
  if (!data) return null;
  const { vtc, groups } = data;
  const stats = [
    ["Members", String(vtc.membersCount)],
    ["Recruitment", vtc.recruitment],
    ["Games", vtc.games.join(" · ") || "—"],
    ["Status", vtc.verified ? "Verified" : vtc.validated ? "Validated" : "Community VTC"],
  ];

  return (
    <section id="vtc" className="relative z-20 bg-black py-28 md:py-40 px-6 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-white/40 text-xs tracking-widest uppercase block mb-3">✦ Live from TruckersMP</span>
            <h2 className="text-3xl md:text-5xl text-white tracking-tight font-light">
              Our <span className="font-bold">VTC</span>
            </h2>
          </div>
          <a
            href={`https://truckersmp.com/vtc/${vtc.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#FFBE00] transition-colors"
          >
            <span>{vtc.tag || vtc.name} on TruckersMP</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
          {stats.map(([label, value]) => (
            <div key={label} className="hyper-card bg-[#0d0c0c] p-6">
              <dt className="text-white/50 text-[11px] uppercase tracking-widest font-medium mb-2">{label}</dt>
              <dd className="flex items-center gap-2 text-2xl font-semibold text-white">
                {value}
                {label === "Status" && (vtc.verified || vtc.validated) && (
                  <BadgeCheck aria-hidden className="h-5 w-5 text-blue-400" />
                )}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-col gap-10">
          {groups.map(({ role, members }) => (
            <div key={role.id}>
              <h3 className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-white/70">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: role.color ?? "#FFBE00" }}
                />
                {role.name}
                <span className="text-white/30 font-normal">{members.length}</span>
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {members.map((member) => (
                  <li key={member.userId}>
                    <a
                      href={member.profileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#0d0c0c] p-3 hover:border-white/20 transition-colors"
                    >
                      <FallbackImage
                        src={member.avatar ?? "/Logo.png"}
                        fallback="/Logo.png"
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-full object-cover"
                      />
                      <span className="truncate text-sm font-medium text-white">{member.username}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
