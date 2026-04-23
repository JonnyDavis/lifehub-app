# ADR 0004: Workspace model for multi-household support

## Context

Phase 1 introduced households as the main scope for app data.
Phase 2 introduced `personal` vs `household` visibility for individual lists and dates.

Phase 3 adds:
- invite links
- multi-household membership
- `profiles.active_household_id`

At that point we needed to decide what “active household” actually means in the product.

Two models were possible:
- Aggregate model: show rows from every household the user belongs to, and use `active_household_id` only as the default target for new inserts.
- Workspace model: treat the active household as the current workspace, so switching changes both what the user sees and where new rows are created.

## Decision

Use the workspace model.

- Keep the database term `household` in schema, migrations, and routes.
- Use “Workspace” in the UI to describe the currently selected household context.
- Scope reads and writes for `lists`, `important_dates`, and `list_items` to `public.current_household_id()` via RLS.
- Keep `personal` visibility as “owner-only within the current workspace”, not a global user-wide personal space.

## Why

- It gives `active_household_id` a clear product meaning instead of making it a hidden insert default.
- It matches user expectations for a switcher: changing workspace should change what you are looking at.
- It keeps RLS easier to reason about than a mixed model where some rows are global and others are workspace-scoped.
- It lets us defer the more complex “global personal space” design until there is a stronger product need.

## Consequences

- Users who belong to multiple households only see one workspace at a time.
- A user’s “personal” rows in workspace A are not visible while they are switched into workspace B.
- If we later want globally personal content, that should be designed explicitly as a separate phase rather than implied by the current `personal` scope.
- Docs and code need to stay clear about the naming split: UI = workspace, schema = household.

## Follow-up direction

Real usage showed an additional product issue that this ADR did not settle:

- if a user starts with a solo/personal workspace and later invites someone in,
  that original workspace becomes shared
- invitees still receive their own personal workspace, so the model becomes asymmetric
- the app also needs a way to support multiple distinct shared spaces with
  different members

The likely next phase is:

- keep one permanent personal workspace per user
- add separately created shared workspaces for collaboration
- restrict invites to shared workspaces
- keep the current "active workspace" model for navigation/RLS
- treat the personal/household visibility toggle as mainly meaningful inside shared workspaces

That is a follow-up evolution of the product model, not a rejection of the Phase 3
"active workspace" decision itself.
