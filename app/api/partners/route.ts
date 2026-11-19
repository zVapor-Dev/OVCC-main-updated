import { getPartners } from "@/lib/truckersmp";
import { json } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { value, stale } = await getPartners();
    return json({ error: false, response: value, stale });
  } catch (error) {
    console.error("Partner feed unavailable", error);
    return json({ error: true, response: [] }, 503);
  }
}
