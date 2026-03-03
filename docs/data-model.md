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

Potential tables:
- `households`
- `household_members`

Follow-up: once household scoping exists, `lists` / `important_dates` gain a `household_id`.
