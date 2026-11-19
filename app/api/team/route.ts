import { getTeam } from "@/lib/db";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return json({ error: false, response: await getTeam() });
  } catch (error) {
    console.error("Team roster unavailable", error);
    return json({ error: true, response: [] }, 503);
  }
}
