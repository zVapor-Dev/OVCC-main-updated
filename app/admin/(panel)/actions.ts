"use server";

import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { isFeatureKey } from "@/lib/features";

export async function setFeature(formData: FormData) {
  const admin = await requireAdmin();
  const key = formData.get("key");
  if (!isFeatureKey(key)) throw new Error("Unknown feature");
  const enabled = formData.get("enabled") === "true";
  await db().featureToggle.upsert({
    where: { key },
    create: { key, enabled, updatedBy: admin.discordId },
    update: { enabled, updatedBy: admin.discordId },
  });
  await audit(admin, "feature.set", { key, enabled });
  revalidatePath("/admin");
}
