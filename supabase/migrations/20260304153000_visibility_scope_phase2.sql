-- Visibility scope (Phase 2): personal vs household
--
-- Goals:
-- - Allow users to mark lists/dates as either:
--   - `personal`: only the owner can see/edit
--   - `household`: all household members can see/edit
-- - Keep privacy safe: existing rows are backfilled to `personal`.
-- - Default behavior:
--   - personal when a household has 1 member
--   - household when a household has 2+ members
--
-- Notes:
-- - `lists.user_id` / `important_dates.user_id` are treated as "owner/created_by".
-- - For `list_items`, access is derived from the parent `lists` row.

-- 1) Default scope helper (SECURITY DEFINER so it can count all household members)
--
-- Why this logic lives in the DB:
-- - We want a single default rule that applies to all writers (server actions, future clients, SQL scripts).
-- - This default depends on household membership count, which is awkward to keep consistent in app code.
--
-- Why SECURITY DEFINER:
-- - Under RLS, a normal caller might not be able to read/count all `household_members` rows.
-- - This function runs with the privileges of its owner (created by migrations), letting it count members safely.
--
-- Why this takes a user id (instead of household id):
-- - Phase 1 enforces one household per user, so "current household" is implicit.
-- - If/when we add multiple households, this should evolve to accept a household id (or use an "active household").
CREATE OR REPLACE FUNCTION public.default_scope_for_user(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  hid uuid;
  member_count integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN 'personal';
  END IF;

  SELECT hm.household_id
  INTO hid
  FROM public.household_members hm
  WHERE hm.user_id = p_user_id
  LIMIT 1;

  IF hid IS NULL THEN
    RETURN 'personal';
  END IF;

  SELECT COUNT(*)
  INTO member_count
  FROM public.household_members hm
  WHERE hm.household_id = hid;

  IF member_count >= 2 THEN
    RETURN 'household';
  END IF;

  RETURN 'personal';
END $$;

REVOKE ALL ON FUNCTION public.default_scope_for_user(uuid) FROM PUBLIC;

-- Wrapper used by application code (via Supabase RPC).
-- The app calls `default_scope_for_current_user()` to choose the UI default
-- when the user isn't explicitly filtering to `personal` or `household`.
CREATE OR REPLACE FUNCTION public.default_scope_for_current_user()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
  SELECT public.default_scope_for_user(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.default_scope_for_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.default_scope_for_current_user() TO authenticated;

-- 2) Add scope columns (backfill existing rows to personal)
--
-- We intentionally start with a static DEFAULT 'personal' so the column can be
-- added quickly and safely, then we:
-- - backfill existing rows to `personal` (privacy-first)
-- - switch the DEFAULT to the dynamic function for *new* rows going forward
ALTER TABLE public.lists
ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'personal';

ALTER TABLE public.important_dates
ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'personal';

-- Enforce allowed values (keep it simple with CHECK, not an enum type).
-- (This makes it easier to change/extend later without managing enum type migrations.)
ALTER TABLE public.lists
DROP CONSTRAINT IF EXISTS lists_scope_check;
ALTER TABLE public.lists
ADD CONSTRAINT lists_scope_check CHECK (scope IN ('personal', 'household'));

ALTER TABLE public.important_dates
DROP CONSTRAINT IF EXISTS important_dates_scope_check;
ALTER TABLE public.important_dates
ADD CONSTRAINT important_dates_scope_check CHECK (scope IN ('personal', 'household'));

-- Explicit backfill (important if this migration is applied to an existing DB).
UPDATE public.lists SET scope = 'personal' WHERE scope IS NULL;
UPDATE public.important_dates SET scope = 'personal' WHERE scope IS NULL;

-- Now switch defaults to "personal when solo, household when shared".
-- This only affects new inserts that omit `scope`.
ALTER TABLE public.lists
ALTER COLUMN scope SET DEFAULT public.default_scope_for_current_user();

ALTER TABLE public.important_dates
ALTER COLUMN scope SET DEFAULT public.default_scope_for_current_user();

-- Small supporting indexes for UI filters and potential future queries.
CREATE INDEX IF NOT EXISTS lists_scope_idx ON public.lists (scope);
CREATE INDEX IF NOT EXISTS important_dates_scope_idx ON public.important_dates (scope);

-- 3) Prevent "scope theft" via updates
--
-- Without this, any household member who can UPDATE a shared row could set:
--   scope = 'personal', user_id = auth.uid()
-- and effectively steal the row.
--
-- We enforce:
-- - `user_id` is immutable after insert
-- - Only the owner can change `scope`
--
-- Why a trigger (vs. RLS alone)?
-- - RLS can restrict which rows you can update, but it is less ergonomic to express
--   "you can update this row, but only the owner can change *this specific column*".
-- - The trigger gives us a clear, explicit guardrail for ownership semantics.
CREATE OR REPLACE FUNCTION public.lists_before_update_guard_owner_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  -- Allow non-JWT contexts (migrations/admin scripts) and service role.
  IF auth.uid() IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'lists.user_id is immutable';
  END IF;

  IF NEW.scope IS DISTINCT FROM OLD.scope THEN
    IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'only the list owner can change visibility';
    END IF;
  END IF;

  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.lists_before_update_guard_owner_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS lists_before_update_guard_owner_fields ON public.lists;
CREATE TRIGGER lists_before_update_guard_owner_fields
BEFORE UPDATE ON public.lists
FOR EACH ROW
EXECUTE FUNCTION public.lists_before_update_guard_owner_fields();

CREATE OR REPLACE FUNCTION public.important_dates_before_update_guard_owner_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'important_dates.user_id is immutable';
  END IF;

  IF NEW.scope IS DISTINCT FROM OLD.scope THEN
    IF OLD.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'only the date owner can change visibility';
    END IF;
  END IF;

  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.important_dates_before_update_guard_owner_fields() FROM PUBLIC;

DROP TRIGGER IF EXISTS important_dates_before_update_guard_owner_fields ON public.important_dates;
CREATE TRIGGER important_dates_before_update_guard_owner_fields
BEFORE UPDATE ON public.important_dates
FOR EACH ROW
EXECUTE FUNCTION public.important_dates_before_update_guard_owner_fields();

-- 4) Update RLS policies to incorporate visibility scope
--
-- For household scope:
-- - Any household member can read/write/delete.
-- For personal scope:
-- - Only the owner (`user_id`) can read/write/delete.
--
-- We still require household membership for both scopes to keep data consistent.
-- (Even personal rows live "within" a household, but they are only visible to their owner.)

-- lists
DROP POLICY IF EXISTS lists_select_household ON public.lists;
DROP POLICY IF EXISTS lists_insert_household ON public.lists;
DROP POLICY IF EXISTS lists_update_household ON public.lists;
DROP POLICY IF EXISTS lists_delete_household ON public.lists;

CREATE POLICY lists_select_visible
ON public.lists
FOR SELECT
TO authenticated
USING (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = lists.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

CREATE POLICY lists_insert_visible
ON public.lists
FOR INSERT
TO authenticated
WITH CHECK (
  household_id IS NOT NULL
  -- `user_id` is the owner/created_by field. Always require "I own what I create".
  -- Without this, a malicious or buggy client could create household rows "owned" by someone else.
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = lists.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

CREATE POLICY lists_update_visible
ON public.lists
FOR UPDATE
TO authenticated
USING (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = lists.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
)
WITH CHECK (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = lists.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

CREATE POLICY lists_delete_visible
ON public.lists
FOR DELETE
TO authenticated
USING (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = lists.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

-- important_dates
DROP POLICY IF EXISTS important_dates_select_household ON public.important_dates;
DROP POLICY IF EXISTS important_dates_insert_household ON public.important_dates;
DROP POLICY IF EXISTS important_dates_update_household ON public.important_dates;
DROP POLICY IF EXISTS important_dates_delete_household ON public.important_dates;

CREATE POLICY important_dates_select_visible
ON public.important_dates
FOR SELECT
TO authenticated
USING (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = important_dates.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

CREATE POLICY important_dates_insert_visible
ON public.important_dates
FOR INSERT
TO authenticated
WITH CHECK (
  household_id IS NOT NULL
  -- Same ownership rule as lists: always set owner to the inserting user.
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = important_dates.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

CREATE POLICY important_dates_update_visible
ON public.important_dates
FOR UPDATE
TO authenticated
USING (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = important_dates.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
)
WITH CHECK (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = important_dates.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

CREATE POLICY important_dates_delete_visible
ON public.important_dates
FOR DELETE
TO authenticated
USING (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = important_dates.household_id
      AND hm.user_id = auth.uid()
  )
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

-- list_items (scoped via parent list visibility)
--
-- list_items doesn't have its own `scope`: it inherits visibility from its parent list.
DROP POLICY IF EXISTS list_items_select_via_household_list ON public.list_items;
DROP POLICY IF EXISTS list_items_insert_via_household_list ON public.list_items;
DROP POLICY IF EXISTS list_items_update_via_household_list ON public.list_items;
DROP POLICY IF EXISTS list_items_delete_via_household_list ON public.list_items;

CREATE POLICY list_items_select_via_visible_list
ON public.list_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lists l
    JOIN public.household_members hm
      ON hm.household_id = l.household_id
    WHERE l.id = list_items.list_id
      AND hm.user_id = auth.uid()
      AND (
        l.scope = 'household'
        OR (l.scope = 'personal' AND l.user_id = auth.uid())
      )
  )
);

CREATE POLICY list_items_insert_via_visible_list
ON public.list_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.lists l
    JOIN public.household_members hm
      ON hm.household_id = l.household_id
    WHERE l.id = list_items.list_id
      AND hm.user_id = auth.uid()
      AND (
        l.scope = 'household'
        OR (l.scope = 'personal' AND l.user_id = auth.uid())
      )
  )
);

CREATE POLICY list_items_update_via_visible_list
ON public.list_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lists l
    JOIN public.household_members hm
      ON hm.household_id = l.household_id
    WHERE l.id = list_items.list_id
      AND hm.user_id = auth.uid()
      AND (
        l.scope = 'household'
        OR (l.scope = 'personal' AND l.user_id = auth.uid())
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.lists l
    JOIN public.household_members hm
      ON hm.household_id = l.household_id
    WHERE l.id = list_items.list_id
      AND hm.user_id = auth.uid()
      AND (
        l.scope = 'household'
        OR (l.scope = 'personal' AND l.user_id = auth.uid())
      )
  )
);

CREATE POLICY list_items_delete_via_visible_list
ON public.list_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lists l
    JOIN public.household_members hm
      ON hm.household_id = l.household_id
    WHERE l.id = list_items.list_id
      AND hm.user_id = auth.uid()
      AND (
        l.scope = 'household'
        OR (l.scope = 'personal' AND l.user_id = auth.uid())
      )
  )
);
