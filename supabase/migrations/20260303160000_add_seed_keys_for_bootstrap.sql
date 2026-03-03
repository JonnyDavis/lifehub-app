-- Seed keys (bootstrapped defaults)
--
-- Purpose:
-- - Make default-data bootstrapping idempotent without deterministic UUIDs.
-- - Provide stable "natural keys" for seeded rows, enforced by unique indexes.
--
-- Notes:
-- - `seed_key` is reserved for bootstrapped default rows and should be treated as
--   an internal, stable identifier (avoid renaming existing keys after deployment).

ALTER TABLE public.lists
ADD COLUMN IF NOT EXISTS seed_key text;

ALTER TABLE public.list_items
ADD COLUMN IF NOT EXISTS seed_key text;

ALTER TABLE public.important_dates
ADD COLUMN IF NOT EXISTS seed_key text;

-- Uniqueness for bootstrapped rows (NULLs do not conflict, so user-created rows
-- that omit seed_key remain unaffected).
CREATE UNIQUE INDEX IF NOT EXISTS lists_user_id_seed_key_uniq
ON public.lists (user_id, seed_key);

CREATE UNIQUE INDEX IF NOT EXISTS important_dates_user_id_seed_key_uniq
ON public.important_dates (user_id, seed_key);

CREATE UNIQUE INDEX IF NOT EXISTS list_items_list_id_seed_key_uniq
ON public.list_items (list_id, seed_key);
