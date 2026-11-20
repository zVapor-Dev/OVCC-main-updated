import { db } from "./db";
import { isEnabled } from "./features";
import { getVtc, getVtcMembers, getVtcRoles } from "./truckersmp";
import { groupByRole, memberRow, planMemberSync, rolesFromMembers, vtcInfo, vtcMembers, vtcRoles } from "./tmp-vtc";

/**
 * Live VTC stats and members, or null when the tmp.liveData toggle is off.
 * Throws when TruckersMP and the saved feed are both unavailable.
 */
export async function getLiveVtc() {
  if (!(await isEnabled("tmp.liveData"))) return null;
  const [info, members, roles] = await Promise.all([
    getVtc(),
    getVtcMembers(),
    getVtcRoles().catch((error) => {
      console.warn("TruckersMP roles feed unavailable", error);
      return null;
    }),
  ]);
  const vtc = vtcInfo(info.value);
  const list = vtcMembers(members.value);
  if (!vtc || !list) throw new Error("Unexpected TruckersMP VTC format");
  const roleList = (roles && vtcRoles(roles.value)) || rolesFromMembers(members.value);
  return {
    vtc,
    groups: groupByRole(list, roleList),
    stale: info.stale || members.stale || !!roles?.stale,
  };
}

export class SyncError extends Error {}

/**
 * Fetches the VTC member list from TruckersMP now and mirrors it into TmpMember.
 * Keeps discordId (set by the bot) and deletes users who left the VTC.
 */
export async function syncMembers() {
  const feed = await getVtcMembers(0);
  if (feed.stale) throw new SyncError("TruckersMP is unavailable");
  const members = vtcMembers(feed.value);
  // A VTC always has its owner; an empty list means a bad response, not "everyone left".
  if (!members?.length) throw new SyncError("TruckersMP returned no members");
  const stored = await db().tmpMember.findMany({ select: { tmpUserId: true } });
  const plan = planMemberSync(
    members,
    stored.map((row) => row.tmpUserId),
  );
  const now = new Date();
  await db().$transaction([
    ...plan.upsert.map((member) =>
      db().tmpMember.upsert({
        where: { tmpUserId: member.userId },
        create: { tmpUserId: member.userId, ...memberRow(member, now) },
        update: memberRow(member, now),
      }),
    ),
    db().tmpMember.deleteMany({ where: { tmpUserId: { in: plan.remove } } }),
  ]);
  return { upserted: plan.upsert.length, removed: plan.remove.length };
}
