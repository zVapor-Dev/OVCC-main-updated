import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

// Add a tab here when you add an admin page.
const tabs = [
  ["Features", "/admin"],
  ["Calendar", "/admin/calendar"],
  ["TruckersMP", "/admin/truckersmp"],
  ["Audit log", "/admin/audit"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-28 sm:px-6">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <nav className="flex flex-wrap gap-2 text-sm">
          {tabs.map(([label, href]) => (
            <Link key={href} href={href} className="rounded-xl border border-white/10 px-3 py-1.5 hover:text-[#FFBE00]">
              {label}
            </Link>
          ))}
        </nav>
        <form action="/admin/auth/logout" method="post" className="flex items-center gap-3 text-sm text-white/60">
          {admin.avatar && <img src={admin.avatar} alt="" className="h-7 w-7 rounded-full" />}
          <span>{admin.username}</span>
          <button className="rounded-xl border border-white/10 px-3 py-1.5 hover:text-[#FFBE00]">Sign out</button>
        </form>
      </header>
      {children}
    </main>
  );
}
