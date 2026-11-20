// Runs once when the Next.js server starts.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startMemberRefresh } = await import("./lib/member-refresh");
  startMemberRefresh();
}
