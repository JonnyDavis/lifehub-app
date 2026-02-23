DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lists'
      AND column_name = 'type'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'lists'
      AND column_name = 'category'
  ) THEN
    ALTER TABLE public.lists RENAME COLUMN type TO category;
  END IF;
END $$;

