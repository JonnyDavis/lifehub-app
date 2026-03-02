-- LifeHub default seed data (committed)
--
-- Purpose:
-- - Provide a small, generic baseline dataset after `supabase db reset`
-- - Cover a few useful UI test cases (done vs todo items, quantity vs none,
--   list icons as key vs null vs short custom text vs emoji vs long invalid)
--
-- Notes:
-- - This is intentionally not a pg_dump.
-- - IDs are fixed so `list_items.list_id` can reference known lists.

BEGIN;

-- Lists
INSERT INTO public.lists (id, title, category, icon) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Groceries', 'shopping', 'shopping-cart'),
  -- icon NULL -> UI should fall back to the category default icon
  ('22222222-2222-2222-2222-222222222222', 'House Chores', 'chores', NULL),
  -- emoji icon -> UI should display short custom text
  ('33333333-3333-3333-3333-333333333333', 'Weekend Trip', 'packing', '✈️'),
  -- short custom text icon -> UI should display text
  ('44444444-4444-4444-4444-444444444444', 'Work Admin', 'other', 'WFH'),
  -- long invalid icon string -> UI should ignore it and fall back to category default icon
  ('55555555-5555-5555-5555-555555555555', 'Errands', 'errands', 'deliveries')
ON CONFLICT (id) DO NOTHING;

-- List items
INSERT INTO public.list_items (id, list_id, label, quantity, notes, is_done, position) VALUES
  -- Groceries
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'Milk', '2L', NULL, false, NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'Apples', '6', NULL, false, NULL),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', '11111111-1111-1111-1111-111111111111', 'Bread', NULL, NULL, true, NULL),

  -- House Chores
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'Take out trash', NULL, NULL, false, NULL),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '22222222-2222-2222-2222-222222222222', 'Vacuum living room', NULL, NULL, true, NULL),

  -- Weekend Trip
  ('cccccccc-cccc-cccc-cccc-ccccccccccc1', '33333333-3333-3333-3333-333333333333', 'Passport', NULL, NULL, false, NULL),
  ('cccccccc-cccc-cccc-cccc-ccccccccccc2', '33333333-3333-3333-3333-333333333333', 'Toothbrush', NULL, NULL, false, NULL),

  -- Errands
  ('dddddddd-dddd-dddd-dddd-ddddddddddd1', '55555555-5555-5555-5555-555555555555', 'Post office', NULL, NULL, false, NULL),
  ('dddddddd-dddd-dddd-dddd-ddddddddddd2', '55555555-5555-5555-5555-555555555555', 'Pick up dry cleaning', NULL, NULL, false, NULL)
ON CONFLICT (id) DO NOTHING;

-- Important dates
INSERT INTO public.important_dates (id, title, date, notes, category) VALUES
  -- upcoming + has notes
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1', 'Dentist', (CURRENT_DATE + 10), 'Bring insurance card', 'appointment'),
  -- upcoming + no notes
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2', 'Pay rent', (CURRENT_DATE + 1), NULL, 'deadline'),
  -- past
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3', 'Alex birthday', (CURRENT_DATE - 14), NULL, 'birthday'),
  -- future (farther out)
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4', 'Concert tickets', (CURRENT_DATE + 60), NULL, 'event'),
  -- renewal-ish
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5', 'Passport renewal', (CURRENT_DATE + 180), NULL, 'renewal')
ON CONFLICT (id) DO NOTHING;

COMMIT;

