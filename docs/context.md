# LifeHub – Context

## What this app is

LifeHub is a small “life admin” app for a household:

- lists (household sharing planned) (e.g. groceries / tasks)
- important dates

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
- `/dashboard` – overview page (lists summary; upcoming dates)
- `/dashboard/lists` – lists index
- `/dashboard/lists/[id]` – list detail + items
- `/dashboard/dates` – important dates (add + view + edit + delete)

`/dashboard/*` is protected in `src/app/dashboard/layout.tsx` via `supabase.auth.getClaims()`.

#### Protected routes + session refresh (Next.js Proxy)

- This app uses Next.js “Proxy” at `src/proxy.ts` to keep Supabase auth cookies in sync (refresh token rotation).
- Redirects for unauthenticated users are handled in `src/lib/supabase/proxy.ts` and are currently enforced for `/dashboard/*`.
- If you add new protected route prefixes outside `/dashboard`, update both:
  - `src/lib/supabase/proxy.ts` (`isProtectedRoute`)
  - `src/proxy.ts` (`config.matcher`)

## Data + auth (how it works today)

- Supabase Auth powers sessions.
- Server-side auth reads/writes cookies via `@supabase/ssr` (`src/lib/supabase/server.ts`).
- Lists + list items are stored in Supabase tables `lists` and `list_items`.
- Important dates are stored in Supabase table `important_dates`.
- Households are represented by `households` and `household_members`.
- RLS enforces per-household data access (rows are scoped to a household, and access is granted via membership).
  - `lists` and `important_dates` have a `household_id` column (defaulting to the current user’s household).
  - `list_items` is scoped via its parent `lists` row.
  - `lists.user_id` / `important_dates.user_id` currently exist but are treated as “created by” (not the primary access scope).
  - `lists.scope` / `important_dates.scope` control whether a row is `personal` (owner-only) or `household` (shared).
- On first `/dashboard` load for a new user, the app:
  - ensures they have a “personal household” (household of 1)
  - bootstraps a small default dataset (lists, items, dates) into that household
- Current lists queries/actions use the Supabase server client from `src/lib/supabase/server.ts`.
  - `lists` includes an optional `category` column (used for list “type”/category).

## Local development (Supabase CLI)

- Local Supabase runs via Docker + the Supabase CLI: `npx supabase start` (and `npx supabase status` for URLs/keys).
- Point the app at local Supabase by setting `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the local values printed by the CLI.
- Local schema is tracked in `supabase/migrations/` (commit these).
- See `docs/supabase-workflow.md` for the full local-first → push-to-prod workflow.

## Environment variables (names only)

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Known gaps / TODOs (important)

- Household scoping is implemented as a Phase 1 MVP:
  - One household per user (“personal household”) for now.
  - No invites / adding other members yet.
- Phase 2 visibility (implemented):
  - Lists and dates can be marked as `personal` or `household`.
  - Defaults are privacy-first: personal when solo; household when shared.
  - Existing rows are treated as `personal` to avoid accidental sharing when households gain new members.
- (Future) Public demo mode: logged-out users can view a default dataset, and can “edit” in the UI, but saving requires creating/logging into an account.
  - Draft edits for logged-out users should stay client-side (in-memory / local storage) and be imported into the user’s household on signup/login.
  - RLS should remain deny-by-default; if we add public access, it should be narrow `anon` read-only access to demo-only data (e.g. separate demo tables or a dedicated demo household), not “`household_id IS NULL` means public”.
- Validation is mostly manual (no Zod yet), and error handling is minimal in server actions.
- No automated tests yet.
- Important date & List create flows could do with reworking slightly.
  - Redirect to created list to populate list items, instead of staying on `/dashboard/lists`.
  - Created dates that don't meet the `upcoming` criteria should instigate a redirect to a visible tab that includes that date e.g. `past`. Important for positive user feedback.
- Implement a delete action for Lists.

## Keeping Codex up to date

When you change any of these, update this file:

- routes / redirects
- auth flows (signup confirm, reset password)
- table shapes used by code
- “what’s implemented vs planned”
