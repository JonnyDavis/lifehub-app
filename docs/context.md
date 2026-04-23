# LifeHub – Context

## What this app is

LifeHub is a small “life admin” app for a household:

- lists (personal + shared workspace scopes) (e.g. groceries / tasks)
- important dates (personal + shared workspace scopes)

This repo is also intended as a portfolio project: keep patterns clean and easy to explain.

## Current user-facing routes

### Auth

- `/auth/login` – email/password login UI
- `/auth/sign-up` – email/password sign up UI
- `/auth/sign-up-success` – shown after sign up when email confirmation is required
- `/auth/forgot-password` – request reset email
- `/auth/update-password` – set new password (requires active reset session; redirects to login if not authenticated)
- `/auth/confirm` – GET route handler that verifies Supabase OTP; on failure, redirects to login with a recovery message instead of a raw error page
- `/auth/error` – simple error page

When authenticated, these routes redirect to `/dashboard` (or a valid `?next=`): `/auth/login`, `/auth/sign-up`, `/auth/forgot-password`, `/auth/sign-up-success`.

### App (protected)

- `/` – redirects to `/dashboard` if authenticated, otherwise `/auth/login` (supports `?next=/some/path`)
- `/dashboard` – overview page (lists summary; upcoming dates)
- `/dashboard/lists` – lists index
- `/dashboard/lists/[id]` – list detail + items
- `/dashboard/dates` – important dates (add + view + edit + delete)
- `/dashboard/household` – workspace switcher + invite link generation/sharing (UI term: “Workspace”)

### Household join (protected)

- `/household/join` – accept an invite token and join a household

Invite signup flow, as intended today:
- a logged-out invite recipient opens `/household/join?token=...`
- the app redirects them to `/auth/login?next=/household/join?token=...`
- if they choose sign up, the signup email confirmation link carries that join URL in `next`
- `/auth/confirm` should verify the OTP, establish the session, and redirect back to `/household/join?token=...`
- `/household/join` accepts the invite for the authenticated user, switches the active workspace, and redirects to `/dashboard`

`/dashboard/*` is protected in `src/app/dashboard/layout.tsx` via `supabase.auth.getClaims()`.

#### Protected routes + session refresh (Next.js Proxy)

- This app uses Next.js “Proxy” at `src/proxy.ts` to keep Supabase auth cookies in sync (refresh token rotation).
- Redirects for unauthenticated users are handled in `src/lib/supabase/proxy.ts` and are currently enforced for `/dashboard/*` and `/household/*`.
- If you add new protected route prefixes, update both:
  - `src/lib/supabase/proxy.ts` (`isProtectedRoute`)
  - `src/proxy.ts` (`config.matcher`)

## Data + auth (how it works today)

- Supabase Auth powers sessions.
- Server-side auth reads/writes cookies via `@supabase/ssr` (`src/lib/supabase/server.ts`).
- Lists + list items are stored in Supabase tables `lists` and `list_items`.
- Important dates are stored in Supabase table `important_dates`.
- Households are represented by `households` and `household_members`.
- The database and route names still use `household`; the UI uses “Workspace” for the currently selected household context.
- RLS enforces per-household data access (rows are scoped to a household, and access is granted via membership).
- `lists` and `important_dates` have a `household_id` column (defaulting to the current user’s household).
- `list_items` is scoped via its parent `lists` row.
- `lists.user_id` / `important_dates.user_id` currently exist but are treated as “created by” (not the primary access scope).
- `lists.scope` / `important_dates.scope` control whether a row is `personal` (owner-only) or `household` (shared).
- Phase 3+ workspace model:
  - `profiles.active_household_id` selects the current workspace.
  - RLS policies for lists/dates/items scope access to `public.current_household_id()` (the active workspace), not “any household you belong to”.
  - “Personal” content is personal within the active workspace, not a global user-level space across all workspaces.
  - Current behavior still allows a user's original personal workspace to become the shared workspace they invite others into.
    - This works for the MVP, but creates asymmetry once invitees also get their own personal workspace.
    - The next phase should separate these concepts more clearly: one permanent personal workspace per user, plus distinct shared workspaces created for collaboration.
- On first `/dashboard` load for a new user, the app:
  - ensures they have a “personal household” (household of 1)
  - ensures their profile/bootstrap state is marked complete
  - does not automatically inject starter lists/dates during provisioning
  - keeps that provisioning targeted at the user's personal household even if they
    reached the dashboard through a shared workspace invite flow
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

- Household/workspace support is implemented through Phase 3:
  - Users can belong to multiple households.
  - `profiles.active_household_id` selects the current household/workspace for reads and inserts.
  - Invite links allow adding other members to a household.
  - The UI says “Workspace”, but schema and route names still say `household`.
  - Inviting someone currently shares the active workspace as-is; we do not yet distinguish between "permanent personal workspace" and "separately created shared workspace".
- Phase 2 visibility (implemented):
  - Lists and dates can be marked as `personal` or `household`.
  - Defaults are privacy-first: personal when solo; household when shared.
  - Existing rows are treated as `personal` to avoid accidental sharing when households gain new members.
  - In practice, the personal/household toggle only adds real value inside shared workspaces; in a purely personal workspace it is effectively redundant.
- Roles/permissions are not implemented yet; all workspace members currently have full write access.
- Household naming is not implemented yet; labels are inferred from creator + member count.
- Future workspace model cleanup:
  - Keep one permanent personal workspace per user.
  - Add explicit creation of shared workspaces instead of converting the original personal workspace into the shared one.
  - Limit invite links to shared workspaces.
  - Hide the personal/household visibility choice when the active workspace is personal.
- (Future) Public demo mode: logged-out users can view a default dataset, and can “edit” in the UI, but saving requires creating/logging into an account.
  - Draft edits for logged-out users should stay client-side (in-memory / local storage) and be imported into the user’s household on signup/login.
  - RLS should remain deny-by-default; if we add public access, it should be narrow `anon` read-only access to demo-only data (e.g. separate demo tables or a dedicated demo household), not “`household_id IS NULL` means public”.
- List/date create flows now redirect to a visible success state with lightweight query-string banners, but validation is still mostly manual (no Zod yet).
- Failed or expired signup confirmation links do not yet have a proper recovery flow.
  - A user can already exist in Supabase Auth before their email is successfully confirmed.
  - Profile creation / household setup / default-data bootstrap happen later, after a confirmed session reaches the dashboard bootstrap flow.
  - We likely need a resend-confirmation path (and clearer messaging for unconfirmed accounts) so users are not stranded in a partially registered state.
- No automated tests yet.
- Provisioning state is still tracked per-user (`profiles.bootstrap_state`), not per-household.
  - This is good enough for now because provisioning only ensures account/personal-workspace setup, not per-workspace starter content.
- Implement a delete action for Lists.

## Keeping Codex up to date

When you change any of these, update this file:

- routes / redirects
- auth flows (signup confirm, reset password)
- table shapes used by code
- “what’s implemented vs planned”
