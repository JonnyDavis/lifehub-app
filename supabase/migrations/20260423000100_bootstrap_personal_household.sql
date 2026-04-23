-- Bootstrap personal household helper
--
-- Purpose:
-- - Ensure new-user default data always targets the user's own personal household,
--   even if their active workspace is currently a shared household they joined
--   via an invite.
-- - Avoid switching `profiles.active_household_id` away from the current shared
--   workspace during bootstrap.
--
-- Why:
-- - Invite-first users can land in a shared workspace before bootstrap runs.
-- - Bootstrapping into the active shared workspace can collide with another
--   member's seeded rows (especially rows that remain `personal` after a
--   workspace becomes shared).

CREATE OR REPLACE FUNCTION public.ensure_bootstrap_personal_household_for_user(
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  personal_household_id uuid;
  new_household_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Prevent duplicate "personal household" creation when multiple bootstrap
  -- requests race for the same user.
  PERFORM pg_advisory_xact_lock(hashtext('bootstrap-personal-household:' || p_user_id::text));

  -- A personal household is one the user created and still belongs to alone.
  SELECT h.id
  INTO personal_household_id
  FROM public.households h
  JOIN public.household_members mine
    ON mine.household_id = h.id
   AND mine.user_id = p_user_id
  LEFT JOIN public.household_members others
    ON others.household_id = h.id
   AND others.user_id <> p_user_id
  WHERE h.created_by = p_user_id
  GROUP BY h.id, h.created_at
  HAVING COUNT(others.user_id) = 0
  ORDER BY h.created_at ASC
  LIMIT 1;

  IF personal_household_id IS NOT NULL THEN
    RETURN personal_household_id;
  END IF;

  new_household_id := extensions.uuid_generate_v4();

  INSERT INTO public.households (id, created_by)
  VALUES (new_household_id, p_user_id);

  INSERT INTO public.household_members (household_id, user_id)
  VALUES (new_household_id, p_user_id)
  ON CONFLICT (household_id, user_id) DO NOTHING;

  RETURN new_household_id;
END $$;

REVOKE ALL ON FUNCTION public.ensure_bootstrap_personal_household_for_user(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.ensure_bootstrap_personal_household()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
  SELECT public.ensure_bootstrap_personal_household_for_user(auth.uid());
$$;

REVOKE ALL ON FUNCTION public.ensure_bootstrap_personal_household() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_bootstrap_personal_household() TO authenticated;
