# ADR 0003: Households (Phase 1 MVP)

## Context

LifeHub currently scopes private app data per-user with strict RLS (`user_id = auth.uid()`).
The next step is to support shared household data (multiple users collaborating on the same lists and important dates).

We want to keep the UX stable for solo users, keep RLS easy to reason about, and avoid risky “migrate my data later” flows.

## Decision

Implement households as the primary scope for app data:

- On first login, create a “personal household” (a household with one member).
- Scope `lists` and `important_dates` to `household_id`.
- Keep `list_items` scoped via its parent `lists` row.
- In the MVP, all household members have full read/write access (no roles/permissions).

## Why

- Keeps the “solo user” experience unchanged: a user starts in a household of one.
- Simplifies RLS: access can be expressed as “is the current user a member of this household?”
- Avoids needing a later migration from per-user rows to household rows when a user decides to share.
- Makes bootstrapping defaults naturally per-household.

## Consequences

- Sharing is “all or nothing” for Phase 1 (inviting a member shares all household data).
- “Personal vs household visibility” for individual lists/dates is deferred to a later phase.
  - Likely implementation: add a visibility/scope field plus an owner field, and update RLS accordingly.
