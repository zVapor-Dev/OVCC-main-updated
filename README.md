# Orvion Convoy Control

The Orvion CC website runs on the Next.js App Router with TypeScript, Prisma and PostgreSQL. The homepage, `/event` availability calendar, and branded 404 page replace the standalone HTML and PHP site.

## Run locally

Use Node.js 22.12+ (22.x) or Node.js 24 LTS, npm, and PostgreSQL. The included Docker Compose service provides a local PostgreSQL 17 database with a persistent volume.

```powershell
Copy-Item .env.example .env
docker compose up -d --wait db
npm ci
npm run db:migrate
npm run dev
```

Open <http://localhost:3000>. If you already have PostgreSQL, skip Docker and set `DATABASE_URL` in `.env` to your own connection string before running the migration. `docker compose stop db` stops the local service without removing its data.

## Data and routes

- **Team:** The initial migration imports the existing founder. Edit `TeamMember` with `npm run db:studio`; `position` controls display order. The homepage and `/api/team` read this table directly.
- **Calendar:** `/api/events` merges hosted and attending TruckersMP events for VTC 87827, deduplicated by ID and sorted by departure time (UTC). Each feed is cached independently in PostgreSQL for 15 minutes. `/api/events?id=123` and `?event_id=123` fetch live details; if unavailable, the dialog keeps showing the listing.
- **Partners:** `/api/partners` preserves the TruckersMP response structure. The homepage shows accepted partners. The feed is cached for 30 minutes.
- **Outages:** The next request after expiry refreshes the relevant feed. On upstream failure, the last saved feed is shown with a notice. A complete failure without cached data shows an unavailable state, not an empty calendar.
- **Old links:** `/index` and `/index.html` redirect to `/`; `/event.html` redirects to `/event`. `/events.php` and `/partners.php` are aliases for the JSON endpoints, including their query parameters.

## Build and deploy

Run `npm test` for the feed mapping tests and `npm run build` for a production build. Client generation and the build do not require a live database.

Deploy as a **Next.js** application, not a static export or PHP server. Provision PostgreSQL and configure `DATABASE_URL` as a server-side environment variable. Install dependencies (including development dependencies for the build), run `npm run db:migrate` against the target database as a release step, and use `npm run build` as the build command. Self-hosted deployments start with `npm start`; Vercel uses its Next.js preset. Use a separate database for previews and keep production credentials out of Git.

