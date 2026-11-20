import { json } from "@/lib/api";
import { isEnabled } from "@/lib/features";
import { getLiveVtc } from "@/lib/tmp-live";

export const dynamic = "force-dynamic";

export async function GET() {
  let enabled = false;
  try {
    enabled = await isEnabled("tmp.liveData");
  } catch (error) {
    console.error("Feature toggles unavailable", error);
  }
  if (!enabled) return json({ error: true, message: "Not found" }, 404);
  try {
    const data = await getLiveVtc();
    if (!data) return json({ error: true, message: "Not found" }, 404);
    const { vtc, groups, stale } = data;
    return json({
      error: false,
      stale,
      response: {
        vtc,
        roles: groups.map(({ role, members }) => ({
          ...role,
          members: members.map(({ userId, username, avatar, roleId, roleName, joinedAt, profileUrl }) => ({
            userId,
            username,
            avatar: avatar ?? null,
            roleId,
            roleName,
            joinedAt,
            profileUrl,
          })),
        })),
      },
    });
  } catch (error) {
    console.error("Live TruckersMP data unavailable", error);
    return json({ error: true, response: null }, 503);
  }
}
