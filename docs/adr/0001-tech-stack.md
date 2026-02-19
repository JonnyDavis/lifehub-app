# ADR 0001: Tech stack for v1

## Decision

Use:
- Next.js App Router + TypeScript
- Tailwind + shadcn/ui for UI
- Supabase for Postgres + Auth

## Why

- Solo-dev friendly, minimal infrastructure.
- Portfolio-friendly: modern patterns (server components/actions, typed UI, real auth).
- Supabase reduces overhead while keeping the SQL model.

## Consequences

- Most backend logic lives inside Next.js (no separate API service for v1).
- We must be careful with auth redirects, cookie/session handling, and table/RLS rules.

