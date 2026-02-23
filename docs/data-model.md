# Data model (current + planned)

This repo currently relies on Supabase tables for lists. “Households” and “Important dates” are planned.

## Implemented (used by code today)

### `lists`

Used fields (based on queries/actions):
- `id` (uuid)
- `title` (text)
- `type` (text, nullable)
- `icon` (text, nullable)
- `created_at` (timestamptz)

### `list_items`

Used fields:
- `id` (uuid)
- `list_id` (uuid, FK → `lists.id`)
- `label` (text)
- `quantity` (text, nullable)
- `is_done` (boolean)
- `position` (int, nullable)
- `created_at` (timestamptz)

### `important_dates`

Used fields:
- `id` (uuid)
- `title` (text)
- `date` (date)
- `category` (text)
- `notes` (text, nullable)
- `created_at` (timestamptz)

## Planned (not fully implemented yet)

### Household scoping

Goal: all user data is scoped to a “household”.

Potential tables:
- `profiles` (app profile tied to `auth.users`)
- `households`
- `household_members`

Follow-up: once household scoping exists, `lists` / `important_dates` gain a `household_id`.
