# Orvion Convoy Control

The Orvion CC website runs on the Next.js App Router with TypeScript, Prisma and PostgreSQL. The homepage, `/event` availability calendar, and branded 404 page replace the standalone HTML and PHP site.

## Run locally

Use Node.js 22.12+ (22.x) or Node.js 24 LTS and npm. PostgreSQL is enabled by default; it can also be disabled as described below. The included Docker Compose service provides a local PostgreSQL 17 database with a persistent volume.

Create `.env` with these local development settings:

```dotenv
POSTGRES_ENABLED=true
DATABASE_URL="postgresql://ovcc:ovcc_local@localhost:5432/ovcc"
```

```powershell
docker compose up -d --wait db
npm ci
npm run db:migrate
npm run dev
```

Open <http://localhost:3000>. If you already have PostgreSQL, skip Docker and set `DATABASE_URL` in `.env` to your own connection string before running the migration. `docker compose stop db` stops the local service without removing its data.

### Run without PostgreSQL

Set this server-side environment variable in `.env` (or your hosting provider's environment settings):

```dotenv
POSTGRES_ENABLED=false
```

Then run `npm ci` and `npm run dev`. No `DATABASE_URL`, Docker database, or migrations are required in this mode. The site uses the original founder roster and fetches events and partners directly from TruckersMP on every request, without database reads, writes, or persistent outage fallback. Upstream failures still show an unavailable state.

Omitting `POSTGRES_ENABLED` or setting it to `true` enables PostgreSQL. Only `true` and `false` are accepted; invalid values report a configuration error. Restart the server (or redeploy) after changing the setting. To re-enable PostgreSQL, configure `DATABASE_URL` and run `npm run db:migrate` before restarting. Disabling it does not delete database data or stop an independently running database service.

## Data and routes

The database-backed behavior below applies when PostgreSQL is enabled.

- **Team:** The initial migration imports the existing founder. Edit `TeamMember` with `npm run db:studio`; `position` controls display order. The homepage and `/api/team` read this table directly.
- **Calendar:** `/api/events` merges hosted and attending TruckersMP events for VTC 87827, deduplicated by ID and sorted by departure time (UTC). Each feed is cached independently in PostgreSQL for 15 minutes. `/api/events?id=123` and `?event_id=123` fetch live details; if unavailable, the dialog keeps showing the listing.
- **Partners:** `/api/partners` preserves the TruckersMP response structure. The homepage shows accepted partners. The feed is cached for 30 minutes.
- **Outages:** The next request after expiry refreshes the relevant feed. On upstream failure, the last saved feed is shown with a notice. A complete failure without cached data shows an unavailable state, not an empty calendar.
- **Old links:** `/index` and `/index.html` redirect to `/`; `/event.html` redirects to `/event`. `/events.php` and `/partners.php` are aliases for the JSON endpoints, including their query parameters.

## Build and deploy

Run `npm test` for the feed mapping and PostgreSQL toggle tests and `npm run build` for a production build. Client generation and the build do not require a live database.

Deploy as a **Next.js** application, not a static export or PHP server. Provision PostgreSQL and configure `DATABASE_URL` as a server-side environment variable. Install dependencies (including development dependencies for the build), run `npm run db:migrate` against the target database as a release step, and use `npm run build` as the build command. Self-hosted deployments start with `npm start`; Vercel uses its Next.js preset. Use a separate database for previews and keep production credentials out of Git.

For a database-free deployment, set `POSTGRES_ENABLED=false` and omit database provisioning, `DATABASE_URL`, and the migration step. The build and start commands stay the same.
