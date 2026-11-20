import { type Json, isRow, webUrl } from "./truckersmp-data";

/**
 * Pure mapping and validation helpers for the TruckersMP VTC endpoints
 * (/vtc/{id}, /vtc/{id}/members, /vtc/{id}/roles). No I/O here so it can be unit tested.
 */

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function int(value: unknown) {
  const n = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof n === "number" && Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** TruckersMP returns "YYYY-MM-DD HH:MM:SS" in UTC. */
export function tmpDate(value: unknown) {
  const raw = text(value);
  if (!/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type VtcInfo = {
  id: number;
  name: string;
  tag: string;
  slogan: string;
  logo?: string;
  membersCount: number;
  verified: boolean;
  validated: boolean;
  recruitmentOpen: boolean;
  recruitment: string;
  games: string[];
  languages: string[];
  created: Date | null;
};

export function vtcInfo(value: Json): VtcInfo | null {
  if (!isRow(value)) return null;
  const id = int(value.id);
  if (!id || !text(value.name)) return null;
  const games = isRow(value.games) ? value.games : {};
  const recruitment = text(value.recruitment);
  return {
    id,
    name: text(value.name),
    tag: text(value.tag),
    slogan: text(value.slogan),
    logo: webUrl(value.logo),
    membersCount: typeof value.members_count === "number" && value.members_count >= 0 ? value.members_count : 0,
    verified: value.verified === true,
    validated: value.validated === true,
    recruitmentOpen: /^open$/i.test(recruitment),
    recruitment: /^open$/i.test(recruitment) ? "Open" : /^closed?$/i.test(recruitment) ? "Closed" : recruitment || "Unknown",
    games: [games.ets === true && "ETS2", games.ats === true && "ATS"].filter((g): g is string => !!g),
    languages: Array.isArray(value.languages) ? value.languages.map(text).filter(Boolean) : [],
    created: tmpDate(value.created),
  };
}

export type VtcRole = { id: number; name: string; order: number; color?: string };

function role(value: unknown): VtcRole | null {
  if (!isRow(value)) return null;
  const id = int(value.id);
  if (!id || !text(value.name)) return null;
  const color = text(value.color);
  return {
    id,
    name: text(value.name),
    order: typeof value.order === "number" ? value.order : Number.MAX_SAFE_INTEGER,
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : undefined,
  };
}

const byOrder = (a: VtcRole, b: VtcRole) => a.order - b.order || a.name.localeCompare(b.name);

/** Accepts the /roles response ({ roles: [...] }) or a bare list. */
export function vtcRoles(value: Json): VtcRole[] | null {
  const list = isRow(value) ? value.roles : value;
  if (!Array.isArray(list)) return null;
  return list.flatMap((r) => role(r) ?? []).sort(byOrder);
}

export type VtcMember = {
  userId: number;
  username: string;
  avatar?: string;
  steamId: string | null;
  roleId: number | null;
  roleName: string | null;
  joinedAt: Date | null;
  profileUrl: string;
};

export function vtcMembers(value: Json): VtcMember[] | null {
  const list = isRow(value) ? value.members : value;
  if (!Array.isArray(list)) return null;
  const seen = new Set<number>();
  return list.flatMap((m) => {
    if (!isRow(m)) return [];
    const userId = int(m.user_id);
    const username = text(m.username);
    if (!userId || !username || seen.has(userId)) return [];
    seen.add(userId);
    // steam_id is a JSON number above 2^53 and loses precision; use the string field.
    const steamId = /^\d{17}$/.test(text(m.steamID)) ? text(m.steamID) : null;
    return [
      {
        userId,
        username,
        avatar: webUrl(m.avatar),
        steamId,
        roleId: int(m.role_id),
        roleName: text(m.role) || null,
        joinedAt: tmpDate(m.joinDate),
        profileUrl: `https://truckersmp.com/user/${userId}`,
      },
    ];
  });
}

/** Roles a member payload carries, used when the /roles feed is unavailable. */
export function rolesFromMembers(value: Json): VtcRole[] {
  const list = isRow(value) ? value.members : value;
  const roles = new Map<number, VtcRole>();
  if (Array.isArray(list))
    for (const m of list)
      if (isRow(m) && Array.isArray(m.roles))
        for (const r of m.roles) {
          const parsed = role(r);
          if (parsed && !roles.has(parsed.id)) roles.set(parsed.id, parsed);
        }
  return [...roles.values()].sort(byOrder);
}

export type RoleGroup = { role: VtcRole; members: VtcMember[] };

/** Groups members by their primary TMP role, in role order; members without a known role go last. */
export function groupByRole(members: VtcMember[], roles: VtcRole[]): RoleGroup[] {
  const known = new Map(roles.map((r) => [r.id, r]));
  const groups = new Map<number, RoleGroup>();
  for (const member of members) {
    const key = member.roleId ?? 0;
    let group = groups.get(key);
    if (!group) {
      const role = known.get(key) ?? {
        id: key,
        name: member.roleName ?? "Member",
        order: Number.MAX_SAFE_INTEGER,
      };
      groups.set(key, (group = { role, members: [] }));
    }
    group.members.push(member);
  }
  for (const group of groups.values()) group.members.sort((a, b) => a.username.localeCompare(b.username));
  return [...groups.values()].sort((a, b) => byOrder(a.role, b.role));
}

// ---------------------------------------------------------------------------
// Admin: role mapping and member sync
// ---------------------------------------------------------------------------

export const SNOWFLAKE = /^\d{17,20}$/;

/**
 * Parses one Discord role ID input. Empty means "remove the mapping".
 * Returns undefined for invalid input.
 */
export function parseDiscordRoleId(value: unknown): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return SNOWFLAKE.test(trimmed) && BigInt(trimmed) > 0n ? trimmed : undefined;
}

export type MappingChange = { tmpRoleId: number; tmpRoleName: string; discordRoleId: string | null };

/**
 * Turns the submitted form fields (`role:<tmpRoleId>` -> Discord role ID) into changes against
 * the current mappings. Only roles in `roles` (from TMP) or already mapped are accepted.
 */
export function planRoleMapping(
  fields: Iterable<[string, unknown]>,
  roles: VtcRole[],
  current: { tmpRoleId: number; tmpRoleName: string; discordRoleId: string }[],
): { changes: MappingChange[]; invalid: number[] } {
  const names = new Map<number, string>(current.map((m) => [m.tmpRoleId, m.tmpRoleName]));
  for (const r of roles) names.set(r.id, r.name);
  const existing = new Map(current.map((m) => [m.tmpRoleId, m.discordRoleId]));
  const changes: MappingChange[] = [];
  const invalid: number[] = [];
  for (const [key, value] of fields) {
    const match = /^role:(\d{1,10})$/.exec(key);
    if (!match) continue;
    const tmpRoleId = Number(match[1]);
    const tmpRoleName = names.get(tmpRoleId);
    if (!tmpRoleName) continue;
    const discordRoleId = parseDiscordRoleId(value);
    if (discordRoleId === undefined) {
      invalid.push(tmpRoleId);
      continue;
    }
    const before = existing.get(tmpRoleId) ?? null;
    const renamed = current.some((m) => m.tmpRoleId === tmpRoleId && m.tmpRoleName !== tmpRoleName);
    if (before !== discordRoleId || (discordRoleId && renamed))
      changes.push({ tmpRoleId, tmpRoleName, discordRoleId });
  }
  return { changes, invalid };
}

/** Which TmpMember rows to upsert and which tmpUserIds to delete. */
export function planMemberSync(members: VtcMember[], storedIds: number[]) {
  const keep = new Set(members.map((m) => m.userId));
  return { upsert: members, remove: storedIds.filter((id) => !keep.has(id)) };
}

/** Columns the site writes on TmpMember. discordId is deliberately absent: the bot owns it. */
export function memberRow(member: VtcMember, syncedAt: Date) {
  return {
    username: member.username,
    steamId: member.steamId,
    roleId: member.roleId,
    roleName: member.roleName,
    joinedAt: member.joinedAt,
    syncedAt,
  };
}
