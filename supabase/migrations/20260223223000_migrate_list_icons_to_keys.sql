DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lists'
      AND column_name = 'icon'
  ) THEN
    UPDATE public.lists
    SET icon = 'shopping-cart'
    WHERE icon = '🛒';

    UPDATE public.lists
    SET icon = 'list-checks'
    WHERE icon = '📝';

    UPDATE public.lists
    SET icon = 'folder-kanban'
    WHERE icon = '🎯';

    UPDATE public.lists
    SET icon = 'backpack'
    WHERE icon = '🎒';
  END IF;
END $$;

