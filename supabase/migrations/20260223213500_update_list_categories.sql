DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lists'
      AND column_name = 'category'
  ) THEN
    UPDATE public.lists
    SET category = 'chores'
    WHERE category = 'tasks';

    UPDATE public.lists
    SET category = 'projects'
    WHERE category = 'goals';

    UPDATE public.lists
    SET category = 'other'
    WHERE category IS NOT NULL
      AND category NOT IN (
        'shopping',
        'chores',
        'errands',
        'packing',
        'maintenance',
        'projects',
        'wishlist',
        'other'
      );
  END IF;
END $$;

