import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalDb = globalThis as typeof globalThis & { ovccPrisma?: PrismaClient };

export function postgresEnabled() {
  const value = process.env.POSTGRES_ENABLED;
  if (value === undefined || value === "true") return true;
  if (value === "false") return false;
  throw new Error("POSTGRES_ENABLED must be true or false");
}

export function db() {
  if (!postgresEnabled()) throw new Error("PostgreSQL is disabled");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return (globalDb.ovccPrisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 }),
  }));
}

export async function getTeam() {
  if (!postgresEnabled()) {
    return [
      {
        username: "m1dwave",
        handle: "m1dwave",
        role: "Founder",
        avatar: "https://cdn.discordapp.com/avatars/804002125474562058/bd1dcf2d46c615dee75b5f33589bfd9d.png?size=4096",
      },
    ];
  }
  return db().teamMember.findMany({
    select: { username: true, handle: true, role: true, avatar: true },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });
}
