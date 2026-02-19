# Architecture

## Overview

- Next.js App Router application.
- Supabase provides:
  - Auth (sessions, email links)
  - Postgres (tables for lists, list items, and planned dates/households)

## Key patterns in this repo

- Protected pages are implemented with server-side auth checks in layouts (see `src/app/dashboard/layout.tsx`).
- Mutations use Next.js Server Actions (`src/lib/actions/*`).
- Reads are mostly in server components via query helpers (`src/lib/queries/*`).

## Supabase clients

- Browser client: `src/lib/supabase/client.ts` (for login/signup/update password)
- Server client: `src/lib/supabase/server.ts` (for SSR + cookie-aware auth)
- Confirm handler: `src/app/auth/confirm/route.ts` (verifies OTP links)

## Deployment notes

- Hosting: Vercel (app), Supabase (DB/Auth).
- Supabase Auth “URL configuration” must include allowed redirect URLs for auth emails.

