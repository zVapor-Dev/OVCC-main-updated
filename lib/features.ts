import { db, postgresEnabled } from "./db";

/** Feature toggles. Every feature is off until an admin turns it on. */
export const FEATURES = {
  "calendar.botEvents": {
    label: "Bot event panels on the calendar",
    help: "Show events created by the Discord bot's event panels on /event.",
  },
  "calendar.manualEvents": {
    label: "Manual calendar entries",
    help: "Show meetings and internal convoys added on the admin Calendar page.",
  },
  "tmp.liveData": {
    label: "Live TruckersMP data",
    help: "Show live VTC stats and members from TruckersMP on the website.",
  },
  "tmp.autoPanels": {
    label: "Auto event panels (bot)",
    help: "The bot posts an event panel in Discord for each new TruckersMP event.",
  },
  "tmp.roleSync": {
    label: "TMP rank to Discord role sync (bot)",
    help: "The bot gives Discord roles based on TruckersMP VTC ranks, using the Roles mapping.",
  },
} as const;

export type FeatureKey = keyof typeof FEATURES;
export const featureKeys = Object.keys(FEATURES) as FeatureKey[];

export function isFeatureKey(value: unknown): value is FeatureKey {
  return typeof value === "string" && value in FEATURES;
}

export async function getFeatures(): Promise<Record<FeatureKey, boolean>> {
  const result = Object.fromEntries(featureKeys.map((key) => [key, false])) as Record<FeatureKey, boolean>;
  if (!postgresEnabled()) return result;
  const rows = await db().featureToggle.findMany();
  for (const row of rows) if (isFeatureKey(row.key)) result[row.key] = row.enabled;
  return result;
}

export async function isEnabled(key: FeatureKey) {
  if (!postgresEnabled()) return false;
  const row = await db().featureToggle.findUnique({ where: { key } });
  return row?.enabled ?? false;
}
