import { postgresEnabled } from "./db";
import { isEnabled } from "./features";
import { syncMembers } from "./tmp-live";

const INTERVAL_MS = 15 * 60_000;
const globalRefresh = globalThis as typeof globalThis & { ovccMemberRefresh?: NodeJS.Timeout };

/** Refreshes TmpMember from TruckersMP while tmp.roleSync or tmp.liveData is on. */
export async function refreshMembersIfEnabled() {
  if (!postgresEnabled()) return null;
  if (!(await isEnabled("tmp.roleSync")) && !(await isEnabled("tmp.liveData"))) return null;
  return syncMembers();
}

export function startMemberRefresh() {
  if (globalRefresh.ovccMemberRefresh || !postgresEnabled()) return;
  const run = () =>
    refreshMembersIfEnabled().then(
      (result) => result && console.log(`TMP members refreshed: ${result.upserted} kept, ${result.removed} removed`),
      (error) => console.warn("TMP member refresh failed", error),
    );
  setTimeout(run, 30_000).unref();
  globalRefresh.ovccMemberRefresh = setInterval(run, INTERVAL_MS);
  globalRefresh.ovccMemberRefresh.unref();
}
