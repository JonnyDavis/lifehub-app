# LifeHub

LifeHub is a full-stack Next.js app for shared household "life admin". The current MVP focuses on the core foundations for secure multi-user collaboration: authentication, lists, important dates, workspace switching, invite-based sharing, and row-level security in Supabase/Postgres.

This repo is also a portfolio project, so the codebase and docs are intended to be easy to review and explain.

## Current functionality

- Email/password auth with SSR-aware session handling
- Protected dashboard routes
- First-run bootstrapping for a new user's personal workspace
- Lists and important dates with `personal` vs `household` visibility
- Invite links for multi-user household sharing
- Active workspace switching that changes visible app data
- Per-workspace access control enforced with Postgres row-level security

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase Auth
- PostgreSQL

## Run locally

Local development is the best way to review and test the app. It avoids hosted auth caveats and gives you access to the local Supabase tools, including local auth email capture.

### Prerequisites

- Node.js
- pnpm
- Docker

### Quickstart

1. Install dependencies:

```bash
pnpm install
```

2. Start the local Supabase stack:

```bash
npx supabase start
```

3. Get the local API URL and publishable key:

```bash
npx supabase status
```

4. Create `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Use the local values printed by `npx supabase status`.

5. Start the app:

```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Recommended local test flow

If you want to try the core MVP behaviour end to end:

1. Sign up a new user locally.
2. Confirm the email in the local mail UI linked from `npx supabase status`.
3. Visit `/dashboard` to trigger first-run workspace and sample-data bootstrapping.
4. Create a second account and use an invite link to join the same household/workspace.
5. Switch active workspaces and verify that lists and dates change with the selected workspace.

## Project docs

Start here:

- `docs/context.md` - current app behaviour, routes, and data model
- `docs/status.md` - what is being worked on next
- `docs/supabase-workflow.md` - local Supabase workflow and schema/data notes
- `docs/adr/` - architectural decision records for key design choices

## Current limitations

- Roles/permissions inside a shared workspace are not implemented yet.
- Household naming is still basic.
- Validation and user-facing error handling are still lightweight in places.
- No automated tests yet.
- The UI is functional but still being iterated on.
