import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, postgresEnabled } from "./db";

export const SESSION_COOKIE = "__Host-ovcc_admin";
export const STATE_COOKIE = "__Host-ovcc_oauth_state";
const SESSION_HOURS = 12;

export type Admin = { discordId: string; username: string; avatar: string | null };

export function adminIds() {
  return new Set(
    (process.env.ADMIN_DISCORD_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => /^\d{17,20}$/.test(id)),
  );
}

export function oauthConfig() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const siteUrl = process.env.SITE_URL;
  if (!clientId || !clientSecret || !siteUrl || !postgresEnabled()) return null;
  return { clientId, clientSecret, redirectUri: new URL("/admin/auth/callback", siteUrl).href };
}

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

export function sameToken(a: string | undefined, b: string | undefined) {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function createSession(admin: Admin) {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3_600_000);
  await db().adminSession.create({ data: { id: hashToken(token), ...admin, expiresAt } });
  await db().adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  return { token, expiresAt };
}

/** Returns the signed-in admin, or null. Re-checks the allowlist on every call. */
export async function currentAdmin(): Promise<Admin | null> {
  if (!postgresEnabled()) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db().adminSession.findUnique({ where: { id: hashToken(token) } });
  if (!session || session.expiresAt < new Date() || !adminIds().has(session.discordId)) return null;
  return { discordId: session.discordId, username: session.username, avatar: session.avatar };
}

/** Use at the top of every admin page AND every admin server action. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function audit(admin: Admin, action: string, detail?: object) {
  await db().adminAuditLog.create({
    data: { actorId: admin.discordId, actorName: admin.username, action, detail: detail ?? undefined },
  });
}
