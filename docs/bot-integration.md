# Discord bot integration

The Orvion CC Discord bot and this website share one PostgreSQL database
(production: `ovcc`, development: `ovcc_dev`). This document is the contract between
them: which tables the bot reads and writes, which columns it owns, and how it must behave.

## Ground rules

- **The website owns the schema.** Tables are created by Prisma migrations in
  `prisma/migrations/`. The bot must **never** run `prisma migrate`, `prisma db push`,
  `CREATE/ALTER/DROP TABLE` or any other DDL on this database. If the bot needs a column or
  table, ask for a website migration first.
- **Names are exact and case sensitive.** Prisma creates PascalCase table names and
  camelCase column names, so always double-quote them: `"CalendarEntry"."startAt"`.
- **All times are UTC**, stored as `timestamp(3)` (millisecond precision, *without* time zone).
  Write UTC values (e.g. `now() at time zone 'utc'`, or a driver configured for UTC); never local time.
- **Defaults exist for ids and timestamps.** `CalendarEntry.id` defaults to a random UUID and
  every `createdAt`/`updatedAt`/`syncedAt` defaults to `CURRENT_TIMESTAMP`, so inserts may omit
  them. The database does **not** bump `updatedAt` on UPDATE (Prisma does that in the website),
  so set `"updatedAt" = now() at time zone 'utc'` in every UPDATE and in `ON CONFLICT DO UPDATE`.
- **Check the toggle before each run.** Every scheduled or event-driven job first reads its
  feature toggle and does nothing when it is off. Do not cache a toggle for longer than about
  one minute, so admins can switch a feature off quickly.
- **Least privilege.** The bot connects with its own database role that has only the grants
  listed at the end of this document.

## Feature toggles

Table `"FeatureToggle"`: **read-only for the bot.** Edited on the admin Features tab.

| Column      | Type           | Notes                                     |
| ----------- | -------------- | ----------------------------------------- |
| `key`       | text, PK       | Toggle key (see below)                    |
| `enabled`   | boolean        | Default `false`                           |
| `updatedAt` | timestamp(3)   | Last change                               |
| `updatedBy` | text, nullable | Discord ID of the admin who changed it    |

A missing row means **off**.

| Key                     | Meaning                                                                                                      | Executed by |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ----------- |
| `calendar.botEvents`    | Show the bot's event panels (`CalendarEntry` rows with source `BOT_PANEL`) on the website calendar `/event`. | Website     |
| `calendar.manualEvents` | Show meetings and internal convoys added on the admin Calendar page.                                         | Website     |
| `tmp.liveData`          | Show live VTC stats and members from TruckersMP on the website.                                              | Website     |
| `tmp.autoPanels`        | The bot posts a Discord event panel for each new TruckersMP event of VTC 87827.                              | **Bot**     |
| `tmp.roleSync`          | The bot gives Discord roles based on TruckersMP VTC ranks, using `TmpRoleMapping`.                           | **Bot**     |

`calendar.botEvents` only controls whether the website *shows* bot panels. The bot keeps
writing `CalendarEntry` rows regardless, so the calendar is complete when the toggle is
switched on.

```sql
SELECT "enabled" FROM "FeatureToggle" WHERE "key" = 'tmp.autoPanels';
-- no row => treat as false
```

## Calendar entries

Table `"CalendarEntry"`: **the bot writes rows with `source = 'BOT_PANEL'`.** The website
writes rows with `source = 'MANUAL'`; the bot must never modify or delete `MANUAL` rows.

| Column             | Type                   | Bot writes | Notes                                                                                       |
| ------------------ | ---------------------- | ---------- | ------------------------------------------------------------------------------------------- |
| `id`               | text, PK               | optional   | DB default: random UUID                                                                     |
| `source`           | enum `CalendarSource`  | yes        | Always `'BOT_PANEL'`                                                                        |
| `kind`             | enum `CalendarKind`    | yes        | `'CONVOY'` (default), `'INTERNAL_CONVOY'`, `'MEETING'`, `'OTHER'`                           |
| `title`            | text                   | yes        |                                                                                             |
| `description`      | text, nullable         | yes        | Plain text                                                                                  |
| `startAt`          | timestamp(3)           | yes        | UTC                                                                                         |
| `endAt`            | timestamp(3), nullable | yes        | UTC                                                                                         |
| `location`         | text, nullable         | yes        | e.g. "Calais ➔ Duisburg"                                                                    |
| `url`              | text, nullable         | yes        | https link (TMP event page or Discord message)                                              |
| `public`           | boolean                | yes        | Default `true`. `false` shows on `/event` as "Booked" without details                       |
| `cancelled`        | boolean                | yes        | Default `false`. Set `true` when the panel is cancelled or deleted                          |
| `tmpEventId`       | integer, nullable      | yes        | Set when the panel is for a TruckersMP event, so the site does not show the event twice     |
| `discordGuildId`   | text, nullable         | yes        |                                                                                             |
| `discordChannelId` | text, nullable         | yes        |                                                                                             |
| `discordMessageId` | text, nullable, unique | yes        | **Key for the bot**: one row per panel message                                              |
| `createdBy`        | text, nullable         | yes        | Discord ID of the user who created the panel                                                |
| `createdAt`        | timestamp(3)           | optional   | DB default `CURRENT_TIMESTAMP`                                                              |
| `updatedAt`        | timestamp(3)           | on update  | DB default on insert; set it yourself on every update                                       |

Rules:

- One row per panel message, keyed by `discordMessageId` (unique index
  `CalendarEntry_discordMessageId_key`). Upsert on it.
- When the panel is edited (time, title, ...) update the row; when it is cancelled or the
  message is deleted, set `cancelled = true` rather than deleting the row.
- Set `tmpEventId` when the panel belongs to a TruckersMP event.

```sql
-- Create or update the row for a panel message.
INSERT INTO "CalendarEntry" (
  "id", "source", "kind", "title", "description", "startAt", "endAt", "location", "url",
  "public", "cancelled", "tmpEventId", "discordGuildId", "discordChannelId", "discordMessageId",
  "createdBy", "updatedAt"
) VALUES (
  $1, 'BOT_PANEL', 'CONVOY', $2, $3, $4, $5, $6, $7,
  true, false, $8, $9, $10, $11,
  $12, now() at time zone 'utc'
)
ON CONFLICT ("discordMessageId") DO UPDATE SET
  "kind"        = EXCLUDED."kind",
  "title"       = EXCLUDED."title",
  "description" = EXCLUDED."description",
  "startAt"     = EXCLUDED."startAt",
  "endAt"       = EXCLUDED."endAt",
  "location"    = EXCLUDED."location",
  "url"         = EXCLUDED."url",
  "public"      = EXCLUDED."public",
  "cancelled"   = EXCLUDED."cancelled",
  "tmpEventId"  = EXCLUDED."tmpEventId",
  "updatedAt"   = EXCLUDED."updatedAt"
WHERE "CalendarEntry"."source" = 'BOT_PANEL';

-- Panel cancelled or message deleted.
UPDATE "CalendarEntry"
SET "cancelled" = true, "updatedAt" = now() at time zone 'utc'
WHERE "discordMessageId" = $1 AND "source" = 'BOT_PANEL';

-- Panel moved to a new time.
UPDATE "CalendarEntry"
SET "startAt" = $2, "endAt" = $3, "updatedAt" = now() at time zone 'utc'
WHERE "discordMessageId" = $1 AND "source" = 'BOT_PANEL';
```

## TruckersMP event panels (`tmp.autoPanels`)

Table `"TmpEventPanel"`: **the bot inserts a row after posting an auto panel.** The website
shows the rows read-only on `/admin/truckersmp`.

| Column       | Type                | Notes                                        |
| ------------ | ------------------- | -------------------------------------------- |
| `tmpEventId` | integer, PK         | TruckersMP event ID                          |
| `guildId`    | text                | Discord guild of the panel                   |
| `channelId`  | text                | Discord channel of the panel                 |
| `messageId`  | text, unique        | Discord message ID of the panel              |
| `createdAt`  | timestamp(3)        | DB default `CURRENT_TIMESTAMP`               |
| `syncedAt`   | timestamp(3)        | DB default `CURRENT_TIMESTAMP`; bump on edit |

Flow for each run, only while `tmp.autoPanels` is on:

1. Fetch VTC 87827 events from `https://api.truckersmp.com/v2/vtc/87827/events` (and
   `/events/attending` if wanted).
2. Skip every TMP event that already has a `TmpEventPanel` row.
3. Post the panel, then insert the `TmpEventPanel` row **and** the matching `CalendarEntry`
   row (with `tmpEventId` set) in one transaction.

```sql
-- Which of these events already have a panel?
SELECT "tmpEventId" FROM "TmpEventPanel" WHERE "tmpEventId" = ANY($1::int[]);

-- After posting. DO NOTHING guards against two bot instances racing.
INSERT INTO "TmpEventPanel" ("tmpEventId", "guildId", "channelId", "messageId")
VALUES ($1, $2, $3, $4)
ON CONFLICT ("tmpEventId") DO NOTHING;

-- When the bot refreshes an existing panel.
UPDATE "TmpEventPanel" SET "syncedAt" = now() at time zone 'utc' WHERE "tmpEventId" = $1;
```

If the insert affected 0 rows, another instance already posted a panel: delete the message
the bot just posted.

## Role mapping (`tmp.roleSync`)

Table `"TmpRoleMapping"`: **read-only for the bot.** Edited on `/admin/truckersmp`. The
website validates `discordRoleId` as a 17 to 20 digit snowflake. A TMP role without a row is
not synced.

| Column          | Type         | Notes                                     |
| --------------- | ------------ | ----------------------------------------- |
| `tmpRoleId`     | integer, PK  | TruckersMP VTC role ID (`/vtc/87827/roles`) |
| `tmpRoleName`   | text         | Role name at the time it was saved        |
| `discordRoleId` | text         | Discord role snowflake                    |
| `updatedAt`     | timestamp(3) |                                           |

```sql
SELECT "tmpRoleId", "discordRoleId" FROM "TmpRoleMapping";
```

Suggested sync, only while `tmp.roleSync` is on: for each `TmpMember` with a `discordId`,
the Discord member should have the mapped role for their `roleId`, and none of the other
mapped roles. Leave Discord roles that are not in the mapping alone.

## VTC members

Table `"TmpMember"`: **the bot reads it and may set `discordId`.** The website fills it from
`https://api.truckersmp.com/v2/vtc/87827/members` automatically every 15 minutes while `tmp.roleSync` or `tmp.liveData` is on, and on demand with "Refresh members now" on
`/admin/truckersmp`); the bot may also refresh it the same way. A refresh upserts every
current member, keeps `discordId` as it is, and deletes rows for users who left the VTC.

| Column      | Type                   | Written by        | Notes                                               |
| ----------- | ---------------------- | ----------------- | --------------------------------------------------- |
| `tmpUserId` | integer, PK            | website / bot     | TruckersMP user ID                                  |
| `username`  | text                   | website / bot     |                                                     |
| `steamId`   | text, nullable         | website / bot     | SteamID64 as a string (it does not fit a JS number) |
| `discordId` | text, nullable, index  | **bot only**      | Linked Discord user; the website never overwrites it |
| `roleId`    | integer, nullable      | website / bot     | Primary TMP role ID (`role_id`)                     |
| `roleName`  | text, nullable         | website / bot     |                                                     |
| `joinedAt`  | timestamp(3), nullable | website / bot     | UTC                                                 |
| `syncedAt`  | timestamp(3)           | website / bot     | DB default `CURRENT_TIMESTAMP`; time of last refresh |

```sql
-- Members with a linked Discord account and their TMP rank.
SELECT "tmpUserId", "discordId", "roleId" FROM "TmpMember" WHERE "discordId" IS NOT NULL;

-- Link a Discord account (e.g. after the user verifies with the bot).
UPDATE "TmpMember" SET "discordId" = $2 WHERE "tmpUserId" = $1;

-- If the bot refreshes the list itself: upsert without touching discordId ...
INSERT INTO "TmpMember" ("tmpUserId", "username", "steamId", "roleId", "roleName", "joinedAt", "syncedAt")
VALUES ($1, $2, $3, $4, $5, $6, now() at time zone 'utc')
ON CONFLICT ("tmpUserId") DO UPDATE SET
  "username" = EXCLUDED."username", "steamId" = EXCLUDED."steamId",
  "roleId" = EXCLUDED."roleId", "roleName" = EXCLUDED."roleName",
  "joinedAt" = EXCLUDED."joinedAt", "syncedAt" = EXCLUDED."syncedAt";
-- ... then remove users who left (never run this with an empty list).
DELETE FROM "TmpMember" WHERE NOT ("tmpUserId" = ANY($1::int[]));
```

## Team roster

Table `"TeamMember"`: **the bot fills it** from the Discord members who have the Sr Mgmt (and
higher) or Developer roles. The homepage "Meet Our Team" section and `/api/team` read it.

| Column     | Type          | Notes                                                                 |
| ---------- | ------------- | --------------------------------------------------------------------- |
| `id`       | serial, PK    | DB default                                                            |
| `handle`   | text, unique  | Discord username (unique key for upserts)                             |
| `username` | text          | Display name                                                          |
| `role`     | text          | Label shown on the card, e.g. "Founder", "Sr Management", "Developer" |
| `avatar`   | text          | https avatar URL                                                      |
| `position` | integer       | Default `0`. Display order, ascending (lower = first)                 |

Use `position` to order by rank (e.g. Founder 0, Owner 10, Sr Management 20, Developer 30).
The bot owns this table: after a sync, delete the rows of people who no longer have a
qualifying role.

```sql
INSERT INTO "TeamMember" ("handle", "username", "role", "avatar", "position")
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT ("handle") DO UPDATE SET
  "username" = EXCLUDED."username", "role" = EXCLUDED."role",
  "avatar" = EXCLUDED."avatar", "position" = EXCLUDED."position";

DELETE FROM "TeamMember" WHERE NOT ("handle" = ANY($1::text[]));
```

## Other tables

`AdminSession`, `AdminAuditLog` and `TruckersMpFeed` belong to the website. The bot has no
access to them.

## Database role for the bot

Create a dedicated login role and grant only what the contract above needs. Run as the
database owner, once per database (`ovcc`, `ovcc_dev`):

```sql
CREATE ROLE ovcc_bot LOGIN PASSWORD 'change-me';

GRANT CONNECT ON DATABASE ovcc TO ovcc_bot;
GRANT USAGE ON SCHEMA public TO ovcc_bot;

-- Read-only
GRANT SELECT ON "FeatureToggle", "TmpRoleMapping" TO ovcc_bot;

-- Calendar panels (no DELETE: cancelled = true instead)
GRANT SELECT, INSERT, UPDATE ON "CalendarEntry" TO ovcc_bot;

-- Auto panels
GRANT SELECT, INSERT, UPDATE ON "TmpEventPanel" TO ovcc_bot;

-- Members: read, link discordId, and optionally refresh the list
GRANT SELECT, INSERT, UPDATE, DELETE ON "TmpMember" TO ovcc_bot;

-- Team roster (owned by the bot); the sequence is needed for the serial id
GRANT SELECT, INSERT, UPDATE, DELETE ON "TeamMember" TO ovcc_bot;
GRANT USAGE ON SEQUENCE "TeamMember_id_seq" TO ovcc_bot;
```

The role gets no `CREATE` on the schema, so it cannot run migrations by accident. If the bot
only links `discordId` and never refreshes the list itself, narrow `TmpMember` to
`GRANT SELECT, UPDATE ("discordId") ON "TmpMember" TO ovcc_bot;`.
