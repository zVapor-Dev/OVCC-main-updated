-- CreateEnum
CREATE TYPE "CalendarSource" AS ENUM ('BOT_PANEL', 'MANUAL');

-- CreateEnum
CREATE TYPE "CalendarKind" AS ENUM ('CONVOY', 'INTERNAL_CONVOY', 'MEETING', 'OTHER');

-- CreateTable
CREATE TABLE "FeatureToggle" (
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "FeatureToggle_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" SERIAL NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEntry" (
    "id" TEXT NOT NULL,
    "source" "CalendarSource" NOT NULL,
    "kind" "CalendarKind" NOT NULL DEFAULT 'CONVOY',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "location" TEXT,
    "url" TEXT,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "tmpEventId" INTEGER,
    "discordGuildId" TEXT,
    "discordChannelId" TEXT,
    "discordMessageId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TmpEventPanel" (
    "tmpEventId" INTEGER NOT NULL,
    "guildId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmpEventPanel_pkey" PRIMARY KEY ("tmpEventId")
);

-- CreateTable
CREATE TABLE "TmpRoleMapping" (
    "tmpRoleId" INTEGER NOT NULL,
    "tmpRoleName" TEXT NOT NULL,
    "discordRoleId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TmpRoleMapping_pkey" PRIMARY KEY ("tmpRoleId")
);

-- CreateTable
CREATE TABLE "TmpMember" (
    "tmpUserId" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "steamId" TEXT,
    "discordId" TEXT,
    "roleId" INTEGER,
    "roleName" TEXT,
    "joinedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TmpMember_pkey" PRIMARY KEY ("tmpUserId")
);

-- CreateIndex
CREATE INDEX "AdminSession_discordId_idx" ON "AdminSession"("discordId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEntry_discordMessageId_key" ON "CalendarEntry"("discordMessageId");

-- CreateIndex
CREATE INDEX "CalendarEntry_startAt_idx" ON "CalendarEntry"("startAt");

-- CreateIndex
CREATE INDEX "CalendarEntry_tmpEventId_idx" ON "CalendarEntry"("tmpEventId");

-- CreateIndex
CREATE UNIQUE INDEX "TmpEventPanel_messageId_key" ON "TmpEventPanel"("messageId");

-- CreateIndex
CREATE INDEX "TmpMember_discordId_idx" ON "TmpMember"("discordId");
