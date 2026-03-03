-- User scoping (strict) + RLS
--
-- Goals:
-- - Scope private app data to the authenticated Supabase user (`auth.uid()`).
-- - Keep schema changes minimal (no households yet).
-- - `list_items` is scoped via its parent `lists` row (no duplicated user_id).
--
-- Notes:
-- - `user_id` is intentionally nullable for now to avoid breaking existing/seed rows.
--   Under strict RLS, rows with NULL `user_id` will be inaccessible to end users.

-- 1) Add ownership columns (nullable, default to current user for new rows)
ALTER TABLE public.lists
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.lists
ALTER COLUMN user_id SET DEFAULT auth.uid();

ALTER TABLE public.important_dates
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE public.important_dates
ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS lists_user_id_idx ON public.lists (user_id);
CREATE INDEX IF NOT EXISTS important_dates_user_id_idx ON public.important_dates (user_id);

-- 2) Reduce anon privileges (RLS is the real guard, but keep grants tight)
REVOKE ALL ON TABLE public.lists FROM anon;
REVOKE ALL ON TABLE public.list_items FROM anon;
REVOKE ALL ON TABLE public.important_dates FROM anon;

-- 3) Enable RLS
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.important_dates ENABLE ROW LEVEL SECURITY;

-- 4) Policies: lists
DROP POLICY IF EXISTS lists_select_own ON public.lists;
CREATE POLICY lists_select_own
ON public.lists
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS lists_insert_own ON public.lists;
CREATE POLICY lists_insert_own
ON public.lists
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS lists_update_own ON public.lists;
CREATE POLICY lists_update_own
ON public.lists
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS lists_delete_own ON public.lists;
CREATE POLICY lists_delete_own
ON public.lists
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 5) Policies: list_items (scoped via parent list ownership)
DROP POLICY IF EXISTS list_items_select_via_own_list ON public.list_items;
CREATE POLICY list_items_select_via_own_list
ON public.list_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lists l
    WHERE l.id = list_items.list_id
      AND l.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS list_items_insert_via_own_list ON public.list_items;
CREATE POLICY list_items_insert_via_own_list
ON public.list_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.lists l
    WHERE l.id = list_items.list_id
      AND l.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS list_items_update_via_own_list ON public.list_items;
CREATE POLICY list_items_update_via_own_list
ON public.list_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lists l
    WHERE l.id = list_items.list_id
      AND l.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.lists l
    WHERE l.id = list_items.list_id
      AND l.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS list_items_delete_via_own_list ON public.list_items;
CREATE POLICY list_items_delete_via_own_list
ON public.list_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lists l
    WHERE l.id = list_items.list_id
      AND l.user_id = auth.uid()
  )
);

-- 6) Policies: important_dates
DROP POLICY IF EXISTS important_dates_select_own ON public.important_dates;
CREATE POLICY important_dates_select_own
ON public.important_dates
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS important_dates_insert_own ON public.important_dates;
CREATE POLICY important_dates_insert_own
ON public.important_dates
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS important_dates_update_own ON public.important_dates;
CREATE POLICY important_dates_update_own
ON public.important_dates
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS important_dates_delete_own ON public.important_dates;
CREATE POLICY important_dates_delete_own
ON public.important_dates
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

