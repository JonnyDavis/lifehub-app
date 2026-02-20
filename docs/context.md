# LifeHub – Context

## What this app is

LifeHub is a small “life admin” app for a household:
- shared lists (e.g. groceries / tasks)
- (planned) important dates

This repo is also intended as a portfolio project: keep patterns clean and easy to explain.

## Current user-facing routes

### Auth

- `/auth/login` – email/password login UI
- `/auth/sign-up` – email/password sign up UI
- `/auth/sign-up-success` – shown after sign up when email confirmation is required
- `/auth/forgot-password` – request reset email
- `/auth/update-password` – set new password (requires active reset session; redirects to login if not authenticated)
- `/auth/confirm` – GET route handler that verifies Supabase OTP
- `/auth/error` – simple error page

When authenticated, these routes redirect to `/dashboard` (or a valid `?next=`): `/auth/login`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/sign-up-success`.

### App (protected)

- `/` – redirects to `/dashboard` if authenticated, otherwise `/auth/login` (supports `?next=/some/path`)
- `/dashboard` – overview page (lists summary; dates are placeholder)
- `/dashboard` – overview page (lists summary; upcoming dates)
- `/dashboard/lists` – lists index
- `/dashboard/lists/[id]` – list detail + items
- `/dashboard/dates` – important dates (add + view + delete)

`/dashboard/*` is protected in `src/app/dashboard/layout.tsx` via `supabase.auth.getClaims()`.

## Data + auth (how it works today)

- Supabase Auth powers sessions.
- Server-side auth reads/writes cookies via `@supabase/ssr` (`src/lib/supabase/server.ts`).
- Lists + list items are stored in Supabase tables `lists` and `list_items`.
- Important dates are stored in Supabase table `important_dates`.
- Current lists queries/actions use the Supabase server client from `src/lib/supabase/server.ts`.

## Local development (Supabase CLI)

- Local Supabase runs via Docker + the Supabase CLI: `npx supabase start` (and `npx supabase status` for URLs/keys).
- Point the app at local Supabase by setting `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the local values printed by the CLI.
- Local schema is tracked in `supabase/migrations/` (commit these).
- See `docs/supabase-workflow.md` for the full local-first → push-to-prod workflow.

## Environment variables (names only)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Known gaps / TODOs (important)

- “Households” scoping is described in `docs/data-model.md` but is **not implemented** in code yet.
- “Important dates” are not household-scoped yet.
- Validation is mostly manual (no Zod yet), and error handling is minimal in server actions.
- No automated tests yet.

## Keeping Codex up to date

When you change any of these, update this file:
- routes / redirects
- auth flows (signup confirm, reset password)
- table shapes used by code
- “what’s implemented vs planned”
