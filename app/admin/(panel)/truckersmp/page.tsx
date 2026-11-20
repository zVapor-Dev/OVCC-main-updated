import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { getFeatures } from "@/lib/features";
import { type VtcRole, vtcRoles } from "@/lib/tmp-vtc";
import { getVtcRoles } from "@/lib/truckersmp";
import { refreshMembers, saveRoleMappings } from "./actions";

const NOTICES: Record<string, [string, boolean]> = {
  saved: ["Role mapping saved.", false],
  unchanged: ["Nothing changed.", false],
  "invalid-role": ["Not saved: a Discord role ID must be a 17 to 20 digit number. Leave it empty to remove.", true],
  refreshed: ["Member list refreshed from TruckersMP.", false],
  upstream: ["TruckersMP is unavailable right now. Nothing was changed.", true],
  empty: ["TruckersMP returned an empty member list. Nothing was changed.", true],
};

const utc = (date: Date) => `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="mb-3 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default async function TruckersMpAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const notice = NOTICES[(await searchParams).notice ?? ""];
  let roles: VtcRole[] | null = null;
  try {
    roles = vtcRoles((await getVtcRoles()).value);
  } catch (error) {
    console.error("TruckersMP roles feed unavailable", error);
  }
  const [mappings, panels, memberCount, lastSync, members, features] = await Promise.all([
    db().tmpRoleMapping.findMany(),
    db().tmpEventPanel.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    db().tmpMember.count(),
    db().tmpMember.aggregate({ _max: { syncedAt: true } }),
    db().tmpMember.findMany({ orderBy: [{ roleName: "asc" }, { username: "asc" }], take: 200 }),
    getFeatures(),
  ]);
  const mapped = new Map(mappings.map((m) => [m.tmpRoleId, m]));
  const rows = [
    ...(roles ?? []).map((r) => ({ id: r.id, name: r.name, color: r.color, orphan: false })),
    ...mappings
      .filter((m) => !roles?.some((r) => r.id === m.tmpRoleId))
      .map((m) => ({ id: m.tmpRoleId, name: m.tmpRoleName, color: undefined, orphan: true })),
  ];
  const syncedAt = lastSync._max.syncedAt;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-extrabold">TruckersMP</h1>
        <p className="text-sm text-white/60">
          VTC 87827. The <code>tmp.autoPanels</code> and <code>tmp.roleSync</code> toggles are on the{" "}
          <Link href="/admin" className="text-[#FFBE00] underline">
            Features tab
          </Link>{" "}
          and are carried out by the Discord bot, which reads this data from the shared database. The site only shows
          live data when <code>tmp.liveData</code> is on.
        </p>
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          {(["tmp.liveData", "tmp.autoPanels", "tmp.roleSync"] as const).map((key) => (
            <li key={key} className="rounded-full border border-white/10 px-3 py-1 text-white/70">
              {key}:{" "}
              <span className={features[key] ? "font-semibold text-[#FFBE00]" : "text-white/40"}>
                {features[key] ? "on" : "off"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {notice && (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            notice[1] ? "border-red-400/40 bg-red-500/10 text-red-200" : "border-[#FFBE00]/30 bg-[#FFBE00]/10 text-[#FFBE00]"
          }`}
        >
          {notice[0]}
        </p>
      )}

      <Card title="Role mapping">
        <p className="mb-4 text-sm text-white/60">
          TruckersMP rank to Discord role ID, used by the bot for <code>tmp.roleSync</code>. Leave a field empty to
          remove its mapping. In Discord, enable Developer Mode and right-click a role to copy its ID.
        </p>
        {roles === null && (
          <p className="mb-4 text-sm text-red-200">
            The TruckersMP roles list is unavailable. Existing mappings can still be changed or removed.
          </p>
        )}
        {rows.length ? (
          <form action={saveRoleMappings} className="space-y-2">
            {rows.map((row) => (
              <label key={row.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-black/30 px-3 py-2">
                <span className="flex min-w-48 flex-1 items-center gap-2 text-sm font-medium">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.color ?? "#666" }}
                  />
                  {row.name}
                  <span className="text-xs text-white/40">#{row.id}</span>
                  {row.orphan && <span className="text-xs text-red-200">no longer on TruckersMP</span>}
                </span>
                <input
                  name={`role:${row.id}`}
                  defaultValue={mapped.get(row.id)?.discordRoleId ?? ""}
                  inputMode="numeric"
                  pattern="\d{17,20}"
                  placeholder="Discord role ID"
                  aria-label={`Discord role ID for ${row.name}`}
                  className="w-64 rounded-lg border border-white/15 bg-black/50 px-3 py-1.5 font-mono text-sm outline-none focus:border-[#FFBE00]"
                />
              </label>
            ))}
            <button className="mt-2 rounded-xl bg-[#FFBE00] px-4 py-2 text-sm font-semibold text-black">
              Save mapping
            </button>
          </form>
        ) : (
          <p className="text-sm text-white/50">No roles to show.</p>
        )}
      </Card>

      <Card title="Members">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            <span className="text-2xl font-bold text-white">{memberCount}</span> stored in <code>TmpMember</code>
            {" · "}
            last synced {syncedAt ? utc(syncedAt) : "never"}
          </p>
          <form action={refreshMembers}>
            <button className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold hover:text-[#FFBE00]">
              Refresh members now
            </button>
          </form>
        </div>
        <p className="mb-3 text-xs text-white/40">
          Refreshing fetches the member list from TruckersMP, updates names and ranks, keeps Discord IDs set by the
          bot, and removes users who left the VTC.
        </p>
        {members.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="py-2 pr-4 font-medium">User</th>
                  <th className="py-2 pr-4 font-medium">Rank</th>
                  <th className="py-2 pr-4 font-medium">Discord ID</th>
                  <th className="py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.tmpUserId} className="border-t border-white/5">
                    <td className="py-2 pr-4">
                      <a
                        href={`https://truckersmp.com/user/${m.tmpUserId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[#FFBE00]"
                      >
                        {m.username}
                      </a>
                    </td>
                    <td className="py-2 pr-4 text-white/70">{m.roleName ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-white/60">{m.discordId ?? "—"}</td>
                    <td className="py-2 text-white/60">{m.joinedAt ? m.joinedAt.toISOString().slice(0, 10) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Event panels">
        <p className="mb-4 text-sm text-white/60">
          TruckersMP events that already have a Discord panel. The bot adds a row after posting a panel for{" "}
          <code>tmp.autoPanels</code> and skips events listed here. Read-only.
        </p>
        {panels.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-white/40">
                <tr>
                  <th className="py-2 pr-4 font-medium">TMP event</th>
                  <th className="py-2 pr-4 font-medium">Discord message</th>
                  <th className="py-2 pr-4 font-medium">Posted</th>
                  <th className="py-2 font-medium">Synced</th>
                </tr>
              </thead>
              <tbody>
                {panels.map((p) => (
                  <tr key={p.tmpEventId} className="border-t border-white/5">
                    <td className="py-2 pr-4">
                      <a
                        href={`https://truckersmp.com/events/${p.tmpEventId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[#FFBE00]"
                      >
                        #{p.tmpEventId}
                      </a>
                    </td>
                    <td className="py-2 pr-4">
                      <a
                        href={`https://discord.com/channels/${p.guildId}/${p.channelId}/${p.messageId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-xs text-white/60 hover:text-[#FFBE00]"
                      >
                        {p.messageId}
                      </a>
                    </td>
                    <td className="py-2 pr-4 text-white/60">{utc(p.createdAt)}</td>
                    <td className="py-2 text-white/60">{utc(p.syncedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-white/50">No panels posted yet.</p>
        )}
      </Card>
    </div>
  );
}
