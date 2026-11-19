import { BadgeCheck, ExternalLink } from "lucide-react";
import { getTeam } from "@/lib/db";
import { getPartners } from "@/lib/truckersmp";
import { acceptedPartners, webUrl } from "@/lib/truckersmp-data";
import { FallbackImage } from "./fallback-image";

export function DirectoryMessage({ children }: { children: React.ReactNode }) {
  return <p className="col-span-full py-16 text-center text-sm text-white/50">{children}</p>;
}

export async function TeamCards() {
  let members;
  try {
    members = await getTeam();
  } catch (error) {
    console.error("Team roster unavailable", error);
    return <DirectoryMessage>Unable to load team members.</DirectoryMessage>;
  }
  if (!members.length) return <DirectoryMessage>No team members available at this time.</DirectoryMessage>;
  return members.map((member) => (
    <article key={member.handle} className="hyper-card flex flex-col items-center p-6 text-center">
      <FallbackImage
        src={webUrl(member.avatar) ?? "/Logo.png"}
        fallback="/Logo.png"
        alt={member.username}
        className="mb-5 h-24 w-24 rounded-full border-2 border-white/10 object-cover"
      />
      <h3 className="text-lg font-bold">{member.username}</h3>
      <span className="mb-3 text-xs text-white/50">@{member.handle}</span>
      <span className="rounded-full border border-[#FFBE00]/20 bg-[#FFBE00]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#FFBE00]">
        {member.role}
      </span>
    </article>
  ));
}

export async function PartnerCards() {
  let feed;
  try {
    feed = await getPartners();
  } catch (error) {
    console.error("Partner feed unavailable", error);
    return <DirectoryMessage>Unable to load TruckersMP partners.</DirectoryMessage>;
  }
  const partners = acceptedPartners(feed.value);
  return (
    <>
      {feed.stale && (
        <p className="col-span-full text-sm text-white/60">
          TruckersMP is unavailable. Showing the last saved partner list.
        </p>
      )}
      {!partners.length && <DirectoryMessage>No partners available at this time.</DirectoryMessage>}
      {partners.map((p) => (
        <article key={p.id} className="hyper-card flex min-h-[220px] flex-col justify-between p-6">
          <div>
            <div className="mb-4 flex items-center gap-4">
              <FallbackImage
                src={p.logo ?? "/Logo.png"}
                fallback="/Logo.png"
                alt=""
                className="h-14 w-14 rounded-full object-cover"
              />
              <h3 className="text-lg font-bold">{p.name}</h3>
              {p.verified && (
                <BadgeCheck aria-label="Verified VTC" className="h-4 w-4 shrink-0 text-blue-400" />
              )}
            </div>
            <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-white/60">
              {p.slogan || "Official Partner of Orvion Convoy Control on TruckersMP."}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4 text-xs">
            {p.discord && (
              <a href={p.discord} target="_blank" rel="noreferrer">
                Discord
              </a>
            )}
            <a
              href={`https://truckersmp.com/vtc/${encodeURIComponent(p.id)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-[#FFBE00]"
            >
              VTC Page <ExternalLink size={14} />
            </a>
          </div>
        </article>
      ))}
    </>
  );
}
