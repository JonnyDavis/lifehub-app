# Data model (current + planned)

This repo currently relies on Supabase tables for lists and important dates. “Households” are planned.

## Implemented (used by code today)

### `profiles`

Used fields:
- `user_id` (uuid, PK, FK → `auth.users.id`)
- `bootstrap_state` (text)
- `bootstrap_started_at` (timestamptz, nullable)
- `bootstrapped_at` (timestamptz, nullable)
- `created_at` (timestamptz)

### `lists`

Used fields (based on queries/actions):
- `id` (uuid)
- `title` (text)
- `category` (text, nullable)
- `icon` (text, nullable)
- `seed_key` (text, nullable; internal for bootstrapped defaults)
- `user_id` (uuid, FK → `auth.users.id`, default = `auth.uid()`)
- `created_at` (timestamptz)

### `list_items`

Used fields:
- `id` (uuid)
- `list_id` (uuid, FK → `lists.id`)
- `seed_key` (text, nullable; internal for bootstrapped defaults)
- `label` (text)
- `quantity` (text, nullable)
- `is_done` (boolean)
- `position` (int, nullable)
- `created_at` (timestamptz)

Note: `list_items` is scoped via its parent `lists` row (no `user_id` column).

### `important_dates`

Used fields:
- `id` (uuid)
- `title` (text)
- `date` (date)
- `category` (text)
- `notes` (text, nullable)
- `seed_key` (text, nullable; internal for bootstrapped defaults)
- `user_id` (uuid, FK → `auth.users.id`, default = `auth.uid()`)
- `created_at` (timestamptz)

## Planned (not fully implemented yet)

### Household scoping

Goal: all user data is scoped to a “household”.

Phase 1 (MVP): household as the primary scope

- Every user gets a “personal household” (household of 1) automatically on first login.
- Adding another user to your household shares all of the household’s data (lists + dates).
- No roles/permissions in MVP: all household members can read/write.

Tables:
- `households`
- `household_members`

Data changes:
- `lists` gains `household_id`
- `important_dates` gains `household_id`
- `list_items` remains scoped via its parent `lists` row (no `household_id` column needed)

Phase 2 (later): personal vs household visibility

- Add a per-row visibility toggle for `lists` / `important_dates` so users can keep some data private.
- Exact default and UI is intentionally deferred until after Phase 1 lands.
