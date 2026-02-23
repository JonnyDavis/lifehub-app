ALTER TABLE "public"."important_dates"
ADD COLUMN IF NOT EXISTS "category" "text" NOT NULL DEFAULT 'other';

ALTER TABLE "public"."important_dates"
ADD CONSTRAINT "important_dates_category_check"
CHECK ("category" IN (
  'deadline',
  'renewal',
  'event',
  'anniversary',
  'appointment',
  'birthday',
  'other'
));
