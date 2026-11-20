"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { SyncError, syncMembers } from "@/lib/tmp-live";
import { type VtcRole, planRoleMapping, vtcRoles } from "@/lib/tmp-vtc";
import { getVtcRoles } from "@/lib/truckersmp";

const PAGE = "/admin/truckersmp";

function done(notice: string): never {
  revalidatePath(PAGE);
  redirect(`${PAGE}?notice=${notice}`);
}

export async function saveRoleMappings(formData: FormData) {
  const admin = await requireAdmin();
  let roles: VtcRole[];
  try {
    roles = vtcRoles((await getVtcRoles()).value) ?? [];
  } catch (error) {
    console.error("TruckersMP roles feed unavailable", error);
    roles = [];
  }
  const current = await db().tmpRoleMapping.findMany();
  const { changes, invalid } = planRoleMapping(formData.entries(), roles, current);
  if (invalid.length) done("invalid-role");
  if (!changes.length) done("unchanged");
  await db().$transaction(
    changes.map(({ tmpRoleId, tmpRoleName, discordRoleId }) =>
      discordRoleId
        ? db().tmpRoleMapping.upsert({
            where: { tmpRoleId },
            create: { tmpRoleId, tmpRoleName, discordRoleId },
            update: { tmpRoleName, discordRoleId },
          })
        : db().tmpRoleMapping.deleteMany({ where: { tmpRoleId } }),
    ),
  );
  for (const change of changes)
    await audit(admin, change.discordRoleId ? "tmp.roleMapping.set" : "tmp.roleMapping.delete", change);
  done("saved");
}

export async function refreshMembers() {
  const admin = await requireAdmin();
  let result;
  try {
    result = await syncMembers();
  } catch (error) {
    console.error("TruckersMP member refresh failed", error);
    done(error instanceof SyncError && /no members/.test(error.message) ? "empty" : "upstream");
  }
  await audit(admin, "tmp.members.refresh", result);
  done("refreshed");
}
