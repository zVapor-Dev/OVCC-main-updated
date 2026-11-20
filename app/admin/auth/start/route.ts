import { NextResponse } from "next/server";
import { STATE_COOKIE, newToken, oauthConfig } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = oauthConfig();
  if (!config) return new Response("Admin login is not configured.", { status: 503 });
  const state = newToken();
  const url = new URL("https://discord.com/oauth2/authorize");
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "none",
  }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
