-- Phase 3: Invites + active household (multi-household support)
--
-- Goals:
-- - Allow users to belong to multiple households.
-- - Introduce an explicit "active household" for the current user (stored in `profiles`).
-- - Add invite links (token-based) to join a household.
--
-- Why we need `profiles.active_household_id`:
-- - With multiple households, "current household" can't be inferred from `household_members`.
-- - App queries/writes should always operate in a single household context.
--
-- High-level design:
-- - `profiles.active_household_id` picks the current household.
-- - `public.current_household_id()` returns the active household id (with a safe fallback).
-- - `public.set_active_household()` updates the active household (membership-checked).
-- - Invite flow:
--   - `public.create_household_invite()` returns a one-time token (stored hashed in DB).
--   - `public.accept_household_invite(token)` joins the household and sets it active.
--
-- Security model notes (important for understanding why this migration uses functions):
-- - We intentionally keep "household context" logic in the database (RLS + helpers), so the app
--   can remain simple: it can ask the DB "what is the current household?" and rely on RLS to
--   enforce access.
-- - Several helpers are `SECURITY DEFINER`:
--   - This lets the function run with the privileges of its owner (the migration role, typically
--     `postgres` in Supabase migrations), which is useful when we want to touch tables the caller
--     cannot access directly (e.g. invites table).
--   - `SET search_path = ...` is included to prevent search_path hijacking (a common footgun with
--     SECURITY DEFINER functions).
--   - We `REVOKE ALL ... FROM PUBLIC` so these helpers can’t be called by unintended roles.
--     For functions the app must call, we re-`GRANT EXECUTE` to `authenticated`.

-- 1) Multi-household: remove Phase 1 "one household per user" constraint
-- Phase 1 enforced a single household per user by adding a unique index on `household_members.user_id`.
-- For multi-household membership (Option B), we drop that index so a user can have many memberships.
DROP INDEX IF EXISTS public.household_members_user_id_uniq;

-- 2) Profiles: add explicit active household
-- We store the *selected* household on the profile. This is what the app (and DB defaults)
-- should use to scope reads/writes when a user belongs to multiple households.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS active_household_id uuid REFERENCES public.households (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_active_household_id_idx
ON public.profiles (active_household_id);

-- Guardrail: active household must be one the user belongs to.
-- This is implemented as a trigger so:
-- - any client path (UI, RPCs, future scripts) is validated consistently
-- - we don't rely on every caller remembering to do membership checks
CREATE OR REPLACE FUNCTION public.profiles_before_update_guard_active_household()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  -- Allow non-user contexts (migrations/admin scripts) and service role.
  IF auth.uid() IS NULL OR auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Only enforce for self-updates (profiles RLS already limits updates to own row).
  IF NEW.active_household_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.user_id = auth.uid()
      AND hm.household_id = NEW.active_household_id
  ) THEN
    RAISE EXCEPTION 'active_household_id must be a household you belong to';
  END IF;

  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.profiles_before_update_guard_active_household() FROM PUBLIC;

DROP TRIGGER IF EXISTS profiles_before_update_guard_active_household ON public.profiles;
CREATE TRIGGER profiles_before_update_guard_active_household
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.profiles_before_update_guard_active_household();

-- 3) Household members: allow members to see *all* members of households they belong to.
-- (Useful for "shared vs personal" defaults and later UI like member lists.)
-- Previously we only allowed "select my membership row". With shared households, it’s useful to
-- allow a member to see other members *in the same household* (still blocked across households).
--
-- Note on reruns:
-- - If you run this migration, hit an error, then rerun it, policies created earlier in the file
--   may already exist depending on whether your migration runner wraps the whole file in a transaction.
-- - Dropping both policy names keeps this migration idempotent across reruns.
DROP POLICY IF EXISTS household_members_select_household ON public.household_members;
DROP POLICY IF EXISTS household_members_select_own ON public.household_members;
CREATE POLICY household_members_select_household
ON public.household_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.household_members mine
    WHERE mine.household_id = household_members.household_id
      AND mine.user_id = auth.uid()
  )
);

-- 4) Active household helpers
--
-- `current_household_id()` is used as a DB DEFAULT for `lists.household_id` / `important_dates.household_id`.
-- It should return the active household if set, otherwise a safe fallback.
--
-- Why have a fallback at all?
-- - In the happy path, `ensure_personal_household*()` ensures every user has:
--   - at least one household membership, and
--   - an `active_household_id` set.
-- - The fallback keeps the system resilient during transitions (existing users before backfill,
--   incomplete local data, or future migrations). It "picks any membership" as a last resort.
--
-- Why `STABLE`?
-- - It depends on `auth.uid()` so it can't be IMMUTABLE.
-- - STABLE is correct for "same result within a statement" and works well for DEFAULTs.
CREATE OR REPLACE FUNCTION public.current_household_id()
RETURNS uuid
LANGUAGE sql
STABLE
SET search_path = public, extensions, auth
AS $$
  SELECT COALESCE(
    (SELECT p.active_household_id FROM public.profiles p WHERE p.user_id = auth.uid()),
    (SELECT hm.household_id FROM public.household_members hm WHERE hm.user_id = auth.uid() LIMIT 1)
  );
$$;

REVOKE ALL ON FUNCTION public.current_household_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_household_id() TO authenticated;

-- Set the active household for the current user (membership-checked).
-- Note: we upsert into `profiles` so the function works even if the profile row hasn’t been created yet.
CREATE OR REPLACE FUNCTION public.set_active_household(p_household_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_household_id IS NULL THEN
    RAISE EXCEPTION 'household_id is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.user_id = auth.uid()
      AND hm.household_id = p_household_id
  ) THEN
    RAISE EXCEPTION 'not a member of this household';
  END IF;

  INSERT INTO public.profiles (user_id, active_household_id)
  VALUES (auth.uid(), p_household_id)
  ON CONFLICT (user_id) DO UPDATE
    SET active_household_id = EXCLUDED.active_household_id;

  RETURN p_household_id;
END $$;

REVOKE ALL ON FUNCTION public.set_active_household(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_active_household(uuid) TO authenticated;

-- Ensure the user has at least one household and an active household selected.
-- (This is a Phase 3 evolution of Phase 1's `ensure_personal_household_for_user`.)
-- This function is intentionally written to be safe to call repeatedly:
-- - If active is already set: do nothing.
-- - Else if the user has any household membership: set active to one of them.
-- - Else: create a brand new single-member household and set it active.
CREATE OR REPLACE FUNCTION public.ensure_personal_household_for_user(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  active_id uuid;
  existing_household_id uuid;
  new_household_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.active_household_id
  INTO active_id
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

  IF active_id IS NOT NULL THEN
    RETURN active_id;
  END IF;

  -- If the user already belongs to any household, pick one and set it active.
  SELECT hm.household_id
  INTO existing_household_id
  FROM public.household_members hm
  WHERE hm.user_id = p_user_id
  LIMIT 1;

  IF existing_household_id IS NOT NULL THEN
    INSERT INTO public.profiles (user_id, active_household_id)
    VALUES (p_user_id, existing_household_id)
    ON CONFLICT (user_id) DO UPDATE
      SET active_household_id = EXCLUDED.active_household_id;
    RETURN existing_household_id;
  END IF;

  -- Otherwise, create a new household (a "personal" household of 1) and set it active.
  new_household_id := extensions.uuid_generate_v4();

  INSERT INTO public.households (id, created_by)
  VALUES (new_household_id, p_user_id);

  INSERT INTO public.household_members (household_id, user_id)
  VALUES (new_household_id, p_user_id)
  ON CONFLICT (household_id, user_id) DO NOTHING;

  INSERT INTO public.profiles (user_id, active_household_id)
  VALUES (p_user_id, new_household_id)
  ON CONFLICT (user_id) DO UPDATE
    SET active_household_id = EXCLUDED.active_household_id;

  RETURN new_household_id;
END $$;

REVOKE ALL ON FUNCTION public.ensure_personal_household_for_user(uuid) FROM PUBLIC;

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

-- Backfill: set active household for existing users (pick any membership).
-- We intentionally pick a deterministic membership per user so reruns are stable.
-- Postgres does not support `MIN()` for UUID, so we use `DISTINCT ON (...) ... ORDER BY ...` instead.
UPDATE public.profiles p
SET active_household_id = hm.household_id
FROM (
  SELECT DISTINCT ON (user_id) user_id, household_id
  FROM public.household_members
  ORDER BY user_id, household_id
) hm
WHERE p.user_id = hm.user_id
  AND p.active_household_id IS NULL;

-- 5) Phase 2 default scope function must use the active household, not an arbitrary membership.
-- Phase 2 introduced "personal vs household" scope for content, with a default that depends on
-- whether you're sharing with anyone.
--
-- With multi-household membership, "am I sharing?" depends on the *active household* specifically.
-- Example: you could have a personal household (solo) and a shared household (2+ members).
-- The default should switch based on which household you’re currently viewing/operating in.
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

  SELECT p.active_household_id
  INTO hid
  FROM public.profiles p
  WHERE p.user_id = p_user_id;

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

-- 6) Invite links
-- We implement invites as "bearer tokens" (whoever has the token can join), similar to a password reset link.
--
-- Key properties:
-- - The DB never stores the raw token: it stores only `token_hash` (sha256).
--   If the table is ever leaked, attackers still can't use the hashes to join without brute forcing.
-- - The raw token is returned once (from `create_household_invite`) and must be treated as sensitive.
-- - We revoke direct table access from `authenticated` and only expose invite operations via RPCs.
CREATE TABLE IF NOT EXISTS public.household_invites (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  household_id uuid NOT NULL REFERENCES public.households (id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  token_hash bytea NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  used_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE public.household_invites OWNER TO postgres;

REVOKE ALL ON TABLE public.household_invites FROM anon;
REVOKE ALL ON TABLE public.household_invites FROM authenticated;

ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;

-- Create an invite for a household you belong to.
-- Returns the raw token (the DB only stores a hash).
-- Note: by default, invites expire after 7 days (ttl). We can tighten this later if needed.
CREATE OR REPLACE FUNCTION public.create_household_invite(
  p_household_id uuid,
  p_ttl_seconds integer DEFAULT 60 * 60 * 24 * 7
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  token text;
  token_hash bytea;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_household_id IS NULL THEN
    RAISE EXCEPTION 'household_id is required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not a member of this household';
  END IF;

  token := encode(extensions.gen_random_bytes(32), 'hex');
  token_hash := extensions.digest(convert_to(token, 'utf8'), 'sha256');

  INSERT INTO public.household_invites (household_id, created_by, token_hash, expires_at)
  VALUES (p_household_id, auth.uid(), token_hash, now() + make_interval(secs => p_ttl_seconds));

  RETURN token;
END $$;

REVOKE ALL ON FUNCTION public.create_household_invite(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_household_invite(uuid, integer) TO authenticated;

-- Accept an invite token:
-- - validate token (exists, not expired, not used)
-- - ensure membership exists for the current user
-- - set the invited household as active
--
-- One-time use:
-- - We mark the invite `used_at`/`used_by` once accepted.
-- - The `WHERE used_at IS NULL` clause prevents reusing the same token later.
-- - In a very rare concurrent-accept race, two requests could potentially both pass the SELECT
--   before either UPDATE runs. If we ever need strict single-use guarantees under concurrency,
--   we can switch to an atomic "UPDATE ... RETURNING" claim pattern.
CREATE OR REPLACE FUNCTION public.accept_household_invite(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_token_hash bytea;
  hid uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RAISE EXCEPTION 'token is required';
  END IF;

  v_token_hash := extensions.digest(convert_to(trim(p_token), 'utf8'), 'sha256');

  SELECT i.household_id
  INTO hid
  FROM public.household_invites i
  WHERE i.token_hash = v_token_hash
    AND i.used_at IS NULL
    AND i.expires_at > now()
  LIMIT 1;

  IF hid IS NULL THEN
    RAISE EXCEPTION 'invalid or expired invite token';
  END IF;

  INSERT INTO public.household_members (household_id, user_id)
  VALUES (hid, auth.uid())
  ON CONFLICT (household_id, user_id) DO NOTHING;

  UPDATE public.household_invites
  SET used_at = now(),
      used_by = auth.uid()
  WHERE public.household_invites.token_hash = v_token_hash
    AND used_at IS NULL;

  PERFORM public.set_active_household(hid);

  RETURN hid;
END $$;

REVOKE ALL ON FUNCTION public.accept_household_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_household_invite(text) TO authenticated;
