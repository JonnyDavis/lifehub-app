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
    SET category = 'other'
    WHERE category IS NULL;
  END IF;
END $$;

