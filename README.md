LifeHub is a small Next.js app for shared household “life admin” (lists today; dates and household scoping planned).

## Getting Started

Install deps and run the dev server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Local Supabase (recommended)

This project uses a local Supabase stack for development (Docker required):

```bash
npx supabase start
npx supabase status
pnpm dev
```

See `docs/supabase-workflow.md` for the full workflow (local schema, seeds, pushing to prod).

## Docs

Start here:
- `docs/context.md`
- `docs/status.md`

## Tech

- Next.js (App Router) + TypeScript
- Tailwind + shadcn/ui
- Supabase (Auth + Postgres)
