-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" SERIAL NOT NULL,
    "handle" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TruckersMpFeed" (
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TruckersMpFeed_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_handle_key" ON "TeamMember"("handle");

-- Carry the existing roster over once, without overwriting later staff edits.
INSERT INTO "TeamMember" ("handle", "username", "role", "avatar") VALUES
('m1dwave', 'm1dwave', 'Founder', 'https://cdn.discordapp.com/avatars/804002125474562058/bd1dcf2d46c615dee75b5f33589bfd9d.png?size=4096');
