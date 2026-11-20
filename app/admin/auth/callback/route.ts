import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, STATE_COOKIE, adminIds, audit, createSession, oauthConfig, sameToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function fail(request: NextRequest, reason: string) {
  const response = NextResponse.redirect(new URL(`/admin/login?error=${reason}`, process.env.SITE_URL ?? request.url));
  response.cookies.delete(STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const config = oauthConfig();
  if (!config) return new Response("Admin login is not configured.", { status: 503 });
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  if (!code || !sameToken(params.get("state") ?? undefined, request.cookies.get(STATE_COOKIE)?.value)) {
    return fail(request, "state");
  }

  const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!tokenRes.ok) return fail(request, "discord");
  const { access_token } = (await tokenRes.json()) as { access_token?: string };
  const userRes = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${access_token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!userRes.ok) return fail(request, "discord");
  const user = (await userRes.json()) as { id: string; username: string; global_name?: string; avatar?: string };
  if (!adminIds().has(user.id)) {
    console.warn(`Admin login refused for Discord user ${user.id}`);
    return fail(request, "denied");
  }

  const admin = {
    discordId: user.id,
    username: user.global_name || user.username,
    avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64` : null,
  };
  const { token, expiresAt } = await createSession(admin);
  await audit(admin, "login");
  const response = NextResponse.redirect(new URL("/admin", process.env.SITE_URL ?? request.url));
  response.cookies.delete(STATE_COOKIE);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return response;
}
