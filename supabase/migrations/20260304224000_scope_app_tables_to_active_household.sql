-- Workspace model (Phase 3): scope app data to the user's *active* household
--
-- Problem:
-- - In Phase 3, a user can belong to multiple households.
-- - Without additional scoping, RLS allowed users to read/write rows in *any* household they are a member of.
-- - This makes "switch active household" feel pointless, because changing `profiles.active_household_id`
--   doesn't change what the user can see — only where new inserts default to.
--
-- Decision:
-- - Adopt a "workspace" model:
--   - the active household is the current workspace context
--   - reads/writes are scoped to that active household
--   - switching workspace changes *both* what you see and where new content is created
--
-- Implementation:
-- - Add `... = public.current_household_id()` constraints to RLS policies for:
--   - `lists`
--   - `important_dates`
--   - `list_items` (via the parent list)
-- - Use `public.is_household_member(...)` (SECURITY DEFINER helper) to avoid policy recursion and
--   to keep membership checks consistent.

-- lists
DROP POLICY IF EXISTS lists_select_visible ON public.lists;
DROP POLICY IF EXISTS lists_insert_visible ON public.lists;
DROP POLICY IF EXISTS lists_update_visible ON public.lists;
DROP POLICY IF EXISTS lists_delete_visible ON public.lists;

CREATE POLICY lists_select_visible
ON public.lists
FOR SELECT
TO authenticated
USING (
  household_id IS NOT NULL
  AND household_id = public.current_household_id()
  AND public.is_household_member(lists.household_id, auth.uid())
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
  AND household_id = public.current_household_id()
  AND user_id = auth.uid()
  AND public.is_household_member(lists.household_id, auth.uid())
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
  AND household_id = public.current_household_id()
  AND public.is_household_member(lists.household_id, auth.uid())
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
)
WITH CHECK (
  household_id IS NOT NULL
  AND household_id = public.current_household_id()
  AND public.is_household_member(lists.household_id, auth.uid())
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
  AND household_id = public.current_household_id()
  AND public.is_household_member(lists.household_id, auth.uid())
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

-- important_dates
DROP POLICY IF EXISTS important_dates_select_visible ON public.important_dates;
DROP POLICY IF EXISTS important_dates_insert_visible ON public.important_dates;
DROP POLICY IF EXISTS important_dates_update_visible ON public.important_dates;
DROP POLICY IF EXISTS important_dates_delete_visible ON public.important_dates;

CREATE POLICY important_dates_select_visible
ON public.important_dates
FOR SELECT
TO authenticated
USING (
  household_id IS NOT NULL
  AND household_id = public.current_household_id()
  AND public.is_household_member(important_dates.household_id, auth.uid())
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
  AND household_id = public.current_household_id()
  AND user_id = auth.uid()
  AND public.is_household_member(important_dates.household_id, auth.uid())
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
  AND household_id = public.current_household_id()
  AND public.is_household_member(important_dates.household_id, auth.uid())
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
)
WITH CHECK (
  household_id IS NOT NULL
  AND household_id = public.current_household_id()
  AND public.is_household_member(important_dates.household_id, auth.uid())
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
  AND household_id = public.current_household_id()
  AND public.is_household_member(important_dates.household_id, auth.uid())
  AND (
    scope = 'household'
    OR (scope = 'personal' AND user_id = auth.uid())
  )
);

-- list_items (inherits visibility and workspace context from parent list)
DROP POLICY IF EXISTS list_items_select_via_visible_list ON public.list_items;
DROP POLICY IF EXISTS list_items_insert_via_visible_list ON public.list_items;
DROP POLICY IF EXISTS list_items_update_via_visible_list ON public.list_items;
DROP POLICY IF EXISTS list_items_delete_via_visible_list ON public.list_items;

CREATE POLICY list_items_select_via_visible_list
ON public.list_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.lists l
    WHERE l.id = list_items.list_id
      AND l.household_id = public.current_household_id()
      AND public.is_household_member(l.household_id, auth.uid())
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
    WHERE l.id = list_items.list_id
      AND l.household_id = public.current_household_id()
      AND public.is_household_member(l.household_id, auth.uid())
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
    WHERE l.id = list_items.list_id
      AND l.household_id = public.current_household_id()
      AND public.is_household_member(l.household_id, auth.uid())
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
    WHERE l.id = list_items.list_id
      AND l.household_id = public.current_household_id()
      AND public.is_household_member(l.household_id, auth.uid())
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
    WHERE l.id = list_items.list_id
      AND l.household_id = public.current_household_id()
      AND public.is_household_member(l.household_id, auth.uid())
      AND (
        l.scope = 'household'
        OR (l.scope = 'personal' AND l.user_id = auth.uid())
      )
  )
);

