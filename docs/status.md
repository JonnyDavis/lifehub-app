# Status (Now / Next / Later)

This file is intentionally short; it’s meant to keep “what’s happening” current between context windows.

## Now

- Stabilise Supabase auth email flows (signup confirmation + reset password end-to-end).
- Finish dates feature MVP (backed by Supabase, not placeholder UI).
- Add strict per-user RLS scoping for lists + dates.
- Bootstrap default data per user (first `/dashboard` load).

## Next

- Add household scoping (Phase 1 MVP):
  - Every user gets a “personal household” (household of 1) on first login.
  - `lists` + `important_dates` become household-scoped; `list_items` stays scoped via parent list.
  - All household members have full read/write access (no roles yet).
- Improve server action validation + user-facing error states.

## Later

- Invites / multiple household support.
- Personal vs household visibility (per-list/per-date toggle).
- Better list UX (inline editing, ordering, mobile interactions).
- Basic test coverage (component + integration; E2E later).
