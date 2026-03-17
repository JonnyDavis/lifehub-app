import type { SupabaseClient } from "@supabase/supabase-js";

export const LISTS_SELECT = "id, title, icon, category, scope" as const;
export const LIST_ITEMS_SELECT = "id, label, quantity, is_done, position" as const;

export const IMPORTANT_DATES_SELECT =
  "id, title, date, notes, category, created_at, scope" as const;
export const UPCOMING_IMPORTANT_DATES_SELECT =
  "id, title, date, notes, category, scope" as const;

export function profilesTable(supabase: SupabaseClient) {
  return supabase.from("profiles");
}

export function householdsTable(supabase: SupabaseClient) {
  return supabase.from("households");
}

export function householdMembersTable(supabase: SupabaseClient) {
  return supabase.from("household_members");
}

export function listsTable(supabase: SupabaseClient) {
  return supabase.from("lists");
}

export function listItemsTable(supabase: SupabaseClient) {
  return supabase.from("list_items");
}

export function importantDatesTable(supabase: SupabaseClient) {
  return supabase.from("important_dates");
}
