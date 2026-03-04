# Data model (current + planned)

This repo currently relies on Supabase tables for lists and important dates. “Households” are planned.

## Implemented (used by code today)

### `profiles`

Used fields:
- `user_id` (uuid, PK, FK → `auth.users.id`)
- `bootstrap_state` (text)
- `bootstrap_started_at` (timestamptz, nullable)
- `bootstrapped_at` (timestamptz, nullable)
- `active_household_id` (uuid, nullable; FK → `households.id`)
- `created_at` (timestamptz)

### `households`

Used fields:
- `id` (uuid)
- `created_by` (uuid, nullable; FK → `auth.users.id`)
- `created_at` (timestamptz)

### `household_members`

Used fields:
- `household_id` (uuid, FK → `households.id`)
- `user_id` (uuid, FK → `auth.users.id`)
- `created_at` (timestamptz)

### `household_invites`

Used fields:
- `household_id` (uuid, FK → `households.id`)
- `created_by` (uuid, nullable; FK → `auth.users.id`)
- `token_hash` (bytea; raw token is never stored)
- `expires_at` (timestamptz)
- `used_at` (timestamptz, nullable)
- `used_by` (uuid, nullable; FK → `auth.users.id`)

### `lists`

Used fields (based on queries/actions):
- `id` (uuid)
- `title` (text)
- `category` (text, nullable)
- `icon` (text, nullable)
- `seed_key` (text, nullable; internal for bootstrapped defaults)
- `user_id` (uuid, FK → `auth.users.id`, default = `auth.uid()`)
- `household_id` (uuid, FK → `households.id`, default = current household)
- `scope` (text; `personal` or `household`)
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
- `household_id` (uuid, FK → `households.id`, default = current household)
- `scope` (text; `personal` or `household`)
- `created_at` (timestamptz)

## Planned (not fully implemented yet)

### Household scoping

Household scoping is implemented (Phase 1–3).

Likely follow-ups:
- Household naming (`households.name`) once profiles have names.
- Roles/permissions (owners/admin actions like removing members).
- A nicer “workspace switcher” UX in the header (UI term).
