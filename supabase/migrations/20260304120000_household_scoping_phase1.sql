-- Household scoping (Phase 1 MVP) + household-based RLS
--
-- Goals:
-- - Introduce `households` + `household_members`.
-- - Scope private app data to a household instead of a single user.
-- - Keep UX stable: every user gets a "personal household" (household of 1).
-- - No roles/permissions yet: any household member can read/write.
--
-- Notes:
-- - We keep `lists.user_id` / `important_dates.user_id` as a "created_by" style
--   field for now, but RLS enforcement moves to household membership.
-- - `list_items` remains scoped via its parent `lists` row.

-- 1) Households + membership tables
CREATE TABLE IF NOT EXISTS public.households (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  -- ON DELETE SET NULL: prevents a shared household from being deleted if one member's account is deleted.
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.households OWNER TO postgres;

CREATE TABLE IF NOT EXISTS public.household_members (
  household_id uuid NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  -- PRIMARY KEY: prevents duplicate memberships, and also allows efficient lookups by household + user.
  PRIMARY KEY (household_id, user_id)
);

ALTER TABLE public.household_members OWNER TO postgres;

-- Phase 1 enforces 1 household per user for simplicity.
--
-- Why:
-- - Phase 1 is "personal household" only (household of 1).
-- - This keeps RLS and bootstrapping straightforward while we land the first household-scoped MVP.
-- - When we add invites / multi-household, we'll remove this uniqueness constraint and add an
--   "active household" concept (likely in `profiles`).
CREATE UNIQUE INDEX IF NOT EXISTS household_members_user_id_uniq
ON public.household_members (user_id);

CREATE INDEX IF NOT EXISTS household_members_household_id_idx
ON public.household_members (household_id);

-- Keep anon privileges tight
REVOKE ALL ON TABLE public.households FROM anon;
REVOKE ALL ON TABLE public.household_members FROM anon;

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- Policies: households
DROP POLICY IF EXISTS households_select_member ON public.households;
CREATE POLICY households_select_member
ON public.households
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = households.id
      AND hm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS households_insert_self ON public.households;
CREATE POLICY households_insert_self
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Policies: household_members
DROP POLICY IF EXISTS household_members_select_own ON public.household_members;
CREATE POLICY household_members_select_own
ON public.household_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Phase 1: users can only add *themselves* to a household they created.
-- (Invites / adding other members is deferred to a later phase.)
DROP POLICY IF EXISTS household_members_insert_self_created_household ON public.household_members;
CREATE POLICY household_members_insert_self_created_household
ON public.household_members
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_id
      AND h.created_by = auth.uid()
  )
);

-- 2) DB helper: ensure a user has a personal household
--
-- This is the core "get-or-create" primitive for Phase 1.
--
-- Why a DB function (vs. app-only logic)?
-- - Single source of truth: one idempotent operation that can be called repeatedly.
-- - Keeps app code simple: the bootstrap route can just call an RPC.
-- - Avoids footguns: we don't want to forget to create membership before inserting household-scoped rows.
--
-- SECURITY DEFINER:
-- - Runs with the privileges of its owner (created by migrations), not the caller.
-- - This is important because it needs to insert into household tables even if caller RLS rules are strict.
--
-- search_path:
-- - Fixed for safety so object names resolve predictably.
CREATE OR REPLACE FUNCTION public.ensure_personal_household_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  existing_household_id uuid;
  new_household_id uuid;
  inserted_member_count integer;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT hm.household_id
  INTO existing_household_id
  FROM public.household_members hm
  WHERE hm.user_id = p_user_id
  LIMIT 1;

  IF existing_household_id IS NOT NULL THEN
    RETURN existing_household_id;
  END IF;

  new_household_id := extensions.uuid_generate_v4();

  INSERT INTO public.households (id, created_by)
  VALUES (new_household_id, p_user_id);

  INSERT INTO public.household_members (household_id, user_id)
  VALUES (new_household_id, p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  GET DIAGNOSTICS inserted_member_count = ROW_COUNT;

  -- Concurrency note:
  -- If two requests race, they may both create a household row, but only one can "win" the membership insert
  -- due to `UNIQUE (user_id)`. When we lose, we delete the orphan household and return the already-created one.
  -- If another request created membership concurrently, avoid leaving an orphan household.
  IF inserted_member_count = 0 THEN
    DELETE FROM public.households h
    WHERE h.id = new_household_id;

    SELECT hm.household_id
    INTO existing_household_id
    FROM public.household_members hm
    WHERE hm.user_id = p_user_id
    LIMIT 1;

    RETURN existing_household_id;
  END IF;

  RETURN new_household_id;
END $$;

REVOKE ALL ON FUNCTION public.ensure_personal_household_for_user(uuid) FROM PUBLIC;

-- App-callable wrapper (uses auth.uid())
--
-- This is the RPC the app calls: `supabase.rpc("ensure_personal_household")`.
-- It only ever acts on the current authenticated user (via `auth.uid()`).
CREATE OR REPLACE FUNCTION public.ensure_personal_household()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
  SELECT public.ensure_personal_household_for_user(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.ensure_personal_household() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_personal_household() TO authenticated;

-- 3) Ensure new users get a personal household when `profiles` is created
--
-- Safety net:
-- - Any code path that creates the `profiles` row will also create the personal household.
-- - This reduces coupling between "profile exists" and "household exists".
CREATE OR REPLACE FUNCTION public.profiles_after_insert_ensure_household()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  PERFORM public.ensure_personal_household_for_user(NEW.user_id);
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.profiles_after_insert_ensure_household() FROM PUBLIC;

DROP TRIGGER IF EXISTS profiles_after_insert_ensure_household ON public.profiles;
CREATE TRIGGER profiles_after_insert_ensure_household
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_after_insert_ensure_household();

-- 4) Helper for defaults/queries: "current" household id for this user
--
-- Used as a DEFAULT value for `lists.household_id` / `important_dates.household_id`, so inserts
-- don't need to pass household_id explicitly from app code.
--
-- STABLE:
-- - Indicates the result won't change within a single statement.
CREATE OR REPLACE FUNCTION public.current_household_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public, extensions, auth
AS $$
  SELECT hm.household_id
  FROM public.household_members hm
  WHERE hm.user_id = auth.uid()
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_household_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_household_id() TO authenticated;

-- 5) Add household scoping to app tables
ALTER TABLE public.lists
ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households (id) ON DELETE CASCADE;

ALTER TABLE public.lists
ALTER COLUMN household_id SET DEFAULT public.current_household_id();

CREATE INDEX IF NOT EXISTS lists_household_id_idx ON public.lists (household_id);

ALTER TABLE public.important_dates
ADD COLUMN IF NOT EXISTS household_id uuid REFERENCES public.households (id) ON DELETE CASCADE;

ALTER TABLE public.important_dates
ALTER COLUMN household_id SET DEFAULT public.current_household_id();

CREATE INDEX IF NOT EXISTS important_dates_household_id_idx ON public.important_dates (household_id);

-- 6) Backfill: create personal households for existing users, then attach existing rows
--
-- After this runs:
-- - Any existing user with `profiles` and/or previously-created `lists` / `important_dates` gets a personal household.
-- - Existing rows are attached to that household via `household_id`.
DO $$
DECLARE
  uid uuid;
BEGIN
  FOR uid IN (
    SELECT DISTINCT user_id FROM public.profiles
    UNION
    SELECT DISTINCT user_id FROM public.lists WHERE user_id IS NOT NULL
    UNION
    SELECT DISTINCT user_id FROM public.important_dates WHERE user_id IS NOT NULL
  )
  LOOP
    PERFORM public.ensure_personal_household_for_user(uid);
  END LOOP;
END $$;

UPDATE public.lists l
SET household_id = hm.household_id
FROM public.household_members hm
WHERE l.user_id IS NOT NULL
  AND l.household_id IS NULL
  AND hm.user_id = l.user_id;

UPDATE public.important_dates d
SET household_id = hm.household_id
FROM public.household_members hm
WHERE d.user_id IS NOT NULL
  AND d.household_id IS NULL
  AND hm.user_id = d.user_id;

-- 7) Seed-key uniqueness for per-household bootstrapping (Phase 1)
CREATE UNIQUE INDEX IF NOT EXISTS lists_household_id_seed_key_uniq
ON public.lists (household_id, seed_key);

CREATE UNIQUE INDEX IF NOT EXISTS important_dates_household_id_seed_key_uniq
ON public.important_dates (household_id, seed_key);

-- 8) Update RLS policies for app tables to use household membership
--
-- Important note for app code:
-- - Most queries do NOT include `WHERE household_id = ...`.
-- - RLS acts as the implicit filter so we can't accidentally fetch another household's data.
-- lists
DROP POLICY IF EXISTS lists_select_own ON public.lists;
CREATE POLICY lists_select_household
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
);

DROP POLICY IF EXISTS lists_insert_own ON public.lists;
CREATE POLICY lists_insert_household
ON public.lists
FOR INSERT
TO authenticated
WITH CHECK (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = lists.household_id
      AND hm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS lists_update_own ON public.lists;
CREATE POLICY lists_update_household
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
)
WITH CHECK (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = lists.household_id
      AND hm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS lists_delete_own ON public.lists;
CREATE POLICY lists_delete_household
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
);

-- list_items (scoped via parent list household membership)
DROP POLICY IF EXISTS list_items_select_via_own_list ON public.list_items;
CREATE POLICY list_items_select_via_household_list
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
  )
);

DROP POLICY IF EXISTS list_items_insert_via_own_list ON public.list_items;
CREATE POLICY list_items_insert_via_household_list
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
  )
);

DROP POLICY IF EXISTS list_items_update_via_own_list ON public.list_items;
CREATE POLICY list_items_update_via_household_list
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
  )
);

DROP POLICY IF EXISTS list_items_delete_via_own_list ON public.list_items;
CREATE POLICY list_items_delete_via_household_list
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
  )
);

-- important_dates
DROP POLICY IF EXISTS important_dates_select_own ON public.important_dates;
CREATE POLICY important_dates_select_household
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
);

DROP POLICY IF EXISTS important_dates_insert_own ON public.important_dates;
CREATE POLICY important_dates_insert_household
ON public.important_dates
FOR INSERT
TO authenticated
WITH CHECK (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = important_dates.household_id
      AND hm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS important_dates_update_own ON public.important_dates;
CREATE POLICY important_dates_update_household
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
)
WITH CHECK (
  household_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = important_dates.household_id
      AND hm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS important_dates_delete_own ON public.important_dates;
CREATE POLICY important_dates_delete_household
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
);
