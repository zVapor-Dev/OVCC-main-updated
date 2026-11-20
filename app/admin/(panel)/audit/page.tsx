import { db } from "@/lib/db";

export default async function AuditPage() {
  const rows = await db().adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <section>
      <h1 className="mb-6 text-2xl font-extrabold">Audit log</h1>
      <ul className="space-y-2 text-sm">
        {rows.map((row) => (
          <li key={row.id} className="rounded-xl border border-white/10 p-3">
            <span className="text-white/50">{row.createdAt.toISOString().replace("T", " ").slice(0, 16)} UTC</span>{" "}
            <strong>{row.actorName}</strong> {row.action}{" "}
            {row.detail != null && <code className="text-xs text-white/50">{JSON.stringify(row.detail)}</code>}
          </li>
        ))}
        {rows.length === 0 && <li className="text-white/60">Nothing yet.</li>}
      </ul>
    </section>
  );
}
