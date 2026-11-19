import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDb = globalThis as typeof globalThis & { ovccPrisma?: PrismaClient };

export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return (globalDb.ovccPrisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }),
  }));
}

export function getTeam() {
  return db().teamMember.findMany({
    select: { username: true, handle: true, role: true, avatar: true },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });
}
