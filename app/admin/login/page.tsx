import { redirect } from "next/navigation";
import { currentAdmin, oauthConfig } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

const errors: Record<string, string> = {
  denied: "That Discord account does not have admin access.",
  state: "The sign-in link expired. Please try again.",
  discord: "Discord could not be reached. Please try again.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const configured = oauthConfig() !== null;
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 pt-24">
      <h1 className="mb-2 text-3xl font-extrabold">
        Admin <span className="text-[#FFBE00]">sign in</span>
      </h1>
      <p className="mb-6 text-sm text-white/60">Staff only. Sign in with the Discord account that has admin access.</p>
      {error && errors[error] && (
        <p role="alert" className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
          {errors[error]}
        </p>
      )}
      {configured ? (
        <a
          href="/admin/auth/start"
          className="rounded-2xl bg-[#5865F2] px-5 py-3 text-center font-semibold text-white hover:bg-[#4752c4]"
        >
          Sign in with Discord
        </a>
      ) : (
        <p className="text-sm text-amber-300">Admin login is not configured on this server.</p>
      )}
    </main>
  );
}
