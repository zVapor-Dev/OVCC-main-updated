import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, hashToken } from "@/lib/admin-auth";
import { db, postgresEnabled } from "@/lib/db";

export const dynamic = "force-dynamic";

// POST only, so a link or image on another site cannot sign an admin out.
export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token && postgresEnabled()) await db().adminSession.deleteMany({ where: { id: hashToken(token) } });
  const response = NextResponse.redirect(new URL("/admin/login", process.env.SITE_URL ?? request.url), 303);
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
