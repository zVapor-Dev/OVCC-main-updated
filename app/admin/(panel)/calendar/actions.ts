"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { audit, requireAdmin } from "@/lib/admin-auth";
import { isEntryId, parseEntryForm } from "@/lib/calendar";
import { db } from "@/lib/db";

function refresh() {
  revalidatePath("/admin/calendar");
  revalidatePath("/event");
}

/** Back to the admin page with a message. redirect() throws, so this never returns. */
function back(params: Record<string, string>): never {
  redirect(`/admin/calendar?${new URLSearchParams(params)}`);
}

async function findEntry(formData: FormData) {
  const id = formData.get("id");
  if (!isEntryId(id)) back({ error: "Unknown entry." });
  const entry = await db().calendarEntry.findUnique({ where: { id } });
  if (!entry) back({ error: "That entry no longer exists." });
  return entry;
}

export async function createEntry(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = parseEntryForm(formData);
  if (!parsed.ok) back({ error: parsed.error });
  const entry = await db().calendarEntry.create({
    data: { ...parsed.value, source: "MANUAL", createdBy: admin.discordId },
  });
  await audit(admin, "calendar.create", { id: entry.id, title: entry.title, startAt: entry.startAt.toISOString() });
  refresh();
  back({ notice: "Entry created." });
}

export async function updateEntry(formData: FormData) {
  const admin = await requireAdmin();
  const entry = await findEntry(formData);
  if (entry.source !== "MANUAL") back({ error: "Bot entries are managed by the bot." });
  const parsed = parseEntryForm(formData);
  if (!parsed.ok) back({ edit: entry.id, error: parsed.error });
  await db().calendarEntry.update({ where: { id: entry.id }, data: parsed.value });
  await audit(admin, "calendar.update", { id: entry.id, title: parsed.value.title });
  refresh();
  back({ notice: "Entry saved." });
}

export async function setEntryCancelled(formData: FormData) {
  const admin = await requireAdmin();
  const entry = await findEntry(formData);
  const cancelled = formData.get("cancelled") === "true";
  // The bot owns its entries: admins may cancel them, but not bring them back.
  if (!cancelled && entry.source !== "MANUAL") back({ error: "Bot entries cannot be uncancelled here." });
  await db().calendarEntry.update({ where: { id: entry.id }, data: { cancelled } });
  await audit(admin, cancelled ? "calendar.cancel" : "calendar.uncancel", { id: entry.id, source: entry.source });
  refresh();
  back({ notice: cancelled ? "Entry cancelled." : "Entry restored." });
}

export async function setEntryPublic(formData: FormData) {
  const admin = await requireAdmin();
  const entry = await findEntry(formData);
  const isPublic = formData.get("public") === "true";
  await db().calendarEntry.update({ where: { id: entry.id }, data: { public: isPublic } });
  await audit(admin, "calendar.public", { id: entry.id, source: entry.source, public: isPublic });
  refresh();
  back({ notice: isPublic ? "Entry is now public." : "Entry now shows as Booked." });
}

export async function deleteEntry(formData: FormData) {
  const admin = await requireAdmin();
  const entry = await findEntry(formData);
  if (entry.source !== "MANUAL") back({ error: "Bot entries are managed by the bot. Cancel it instead." });
  await db().calendarEntry.delete({ where: { id: entry.id } });
  await audit(admin, "calendar.delete", { id: entry.id, title: entry.title, startAt: entry.startAt.toISOString() });
  refresh();
  back({ notice: "Entry deleted." });
}
