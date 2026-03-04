-- Fix: household_members RLS policy recursion (Postgres 42P17)
--
-- Symptom:
-- - Queries that touch household-scoped tables fail with:
--   `infinite recursion detected in policy for relation "household_members"` (SQLSTATE 42P17)
--
-- Root cause:
-- - Our `household_members` SELECT policy ("members can see all members in their household")
--   referenced `public.household_members` inside the policy expression.
-- - Postgres applies RLS to that inner query as well, which re-enters the same policy, creating
--   a recursion loop that Postgres detects and rejects.
--
-- Fix strategy:
-- - Move the membership check into a SECURITY DEFINER helper function owned by the migration role.
-- - Table owners bypass RLS (unless FORCE ROW LEVEL SECURITY is enabled), so the helper can query
--   `household_members` without re-triggering the `household_members` policy.
-- - Update the policy to call the helper instead of querying the table directly.

-- Helper: "is user a member of this household?"
CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.is_household_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_household_member(uuid, uuid) TO authenticated;

-- Replace the recursive policy with a non-recursive one.
DROP POLICY IF EXISTS household_members_select_household ON public.household_members;
CREATE POLICY household_members_select_household
ON public.household_members
FOR SELECT
TO authenticated
USING (
  public.is_household_member(household_members.household_id, auth.uid())
);

