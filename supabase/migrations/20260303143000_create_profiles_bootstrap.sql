-- Profiles (per-user settings) + bootstrap defaults guard
--
-- Purpose:
-- - Track per-user settings/state (starting with "has this user been bootstrapped?")
-- - Support idempotent "create default data on first dashboard load" behavior

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  bootstrap_state text NOT NULL DEFAULT 'not_started',
  bootstrap_started_at timestamp with time zone,
  bootstrapped_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_bootstrap_state_check CHECK (bootstrap_state IN ('not_started', 'in_progress', 'done'))
);

ALTER TABLE public.profiles OWNER TO postgres;

-- Keep anon privileges tight (public demo can be added later, explicitly)
REVOKE ALL ON TABLE public.profiles FROM anon;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
CREATE POLICY profiles_insert_own
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

