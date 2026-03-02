# Supabase workflow (local-first → push to prod)

This repo uses a **local Supabase stack** (via Docker + Supabase CLI) for day-to-day development.
Schema changes are tracked in git as SQL migrations under `supabase/migrations/`.

## Prereqs

- Docker is installed and running.
- Supabase CLI is available via `npx supabase ...`.

## Start/stop local Supabase

- Start: `npx supabase start`
- Stop: `npx supabase stop`
- Status (URLs + keys): `npx supabase status`

Use the **Studio** and **Inbucket** URLs printed by `npx supabase status`:
- Studio: browse tables/policies locally
- Inbucket: view local auth emails (signup confirmation, password reset)

## Point the app at local Supabase

In `.env.local` (do not commit), set:
- `NEXT_PUBLIC_SUPABASE_URL` (the local **API URL** printed by `npx supabase status`)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (the local **anon/publishable key** printed by `npx supabase status`)

Then run the app: `pnpm dev`

## Schema workflow (source of truth = migrations)

### Pull schema changes from prod (dashboard → git)

If you made changes to the hosted project via the Supabase dashboard (SQL editor / table editor), pull them into migrations:

- Link to the hosted project (one-time): `npx supabase link --project-ref <ref>`
- Pull schema into a new migration: `npx supabase db pull`

Commit the new file(s) under `supabase/migrations/`.

### Apply schema locally

Rebuild local database from migrations:

- `npx supabase db reset`

This drops and recreates the local database, applies migrations, and then runs seeds (if configured).

### Push schema to prod (git → hosted)

To apply your local migrations to the hosted database:

- `npx supabase db push --linked`

## Data workflow (local-only)

Local dev data is intentionally **not** committed.

- `supabase/seed.default.sql` is committed and provides a small, generic baseline dataset for local development.
- `supabase/seed.sql` is git-ignored (see `supabase/.gitignore`) and is intended for local-only dumps/experiments.
- The local stack loads `supabase/seed.default.sql` during `npx supabase db reset` (see `supabase/config.toml`).

### Keep local data between `db reset`s

If you want to keep the data you created in the **local** Docker database, dump local data into `supabase/seed.sql` before resetting:

- Dump local data: `npx supabase db dump --local --data-only --schema public --file supabase/seed.sql`
- Reset (loads `seed.default.sql`): `npx supabase db reset`
- Optional: load your local-only `supabase/seed.sql` after reset (e.g. via psql or Studio SQL editor).

Note: `--linked` dumps data from the hosted (linked) Supabase project, not your local stack.

### One-time snapshot: copy hosted data into local

If you want your local DB to have the same app data as the hosted project:

- Dump hosted data: `npx supabase db dump --linked --data-only --schema public --file supabase/seed.sql`
- Load into local (loads `seed.default.sql`): `npx supabase db reset`

## Auth email templates (local)

Local auth email templates are file-based and configured in `supabase/config.toml`:

- `supabase/templates/confirmation.html`
- `supabase/templates/recovery.html`

After changing templates or `supabase/config.toml`, restart the local stack:
- `npx supabase stop`
- `npx supabase start`

Note: hosted (prod) email templates are configured in the Supabase dashboard; local templates do not automatically sync to prod.

## Common troubleshooting

- Emails not showing up: confirm `auth.email.enable_confirmations = true` in `supabase/config.toml` and check the Inbucket URL from `npx supabase status`.
- Wrong environment: confirm `.env.local` points to the **local** API URL (not the hosted project URL).
