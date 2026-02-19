# LifeHub (agent instructions)

This repo is a small portfolio-grade Next.js app (“LifeHub”) for shared household “life admin”.

## Read-first docs

- `docs/context.md` (current state + what’s true right now)
- `docs/status.md` (what we’re building next)
- `docs/adr/` (why decisions were made)

## Guardrails

- Do not modify repo files unless explicitly asked to (when unsure, ask first).
- Do **not** copy/paste secrets. Never commit `.env.local` values.
- If you need to mention env vars in docs/code review, list **names only** (e.g. `NEXT_PUBLIC_SUPABASE_URL`).
- Prefer small diffs. Avoid drive-by refactors unless explicitly requested.
- Keep docs in sync: if you change a user-facing flow (auth, lists), update `docs/context.md`.

## Tech + patterns (what exists today)

- Next.js App Router.
- Supabase Auth:
  - Browser client: `src/lib/supabase/client.ts`
  - Server client (cookies/SSR): `src/lib/supabase/server.ts`
  - Confirm route: `src/app/auth/confirm/route.ts`
- Protected area:
  - `src/app/dashboard/layout.tsx` checks auth claims and redirects to `/auth/login`.
- Lists CRUD:
  - Queries: `src/lib/queries/lists.ts`
  - Mutations (server actions): `src/lib/actions/lists.ts`

## Common commands

- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`

## If you’re debugging auth redirects

Start with:
- `src/app/auth/confirm/route.ts`
- `src/components/sign-up-form.tsx` (`emailRedirectTo`)
- Supabase “Auth → URL configuration” (Site URL + Redirect URLs)
