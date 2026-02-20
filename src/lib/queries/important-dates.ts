import { createClient } from "@/lib/supabase/server";

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export async function getImportantDates() {
  const supabase = await createClient();
  const { data: dates, error } = await supabase
    .from("important_dates")
    .select("id, title, date, notes, created_at")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching important dates:", error);
    throw error;
  }

  return dates ?? [];
}

export async function getUpcomingImportantDates(limit = 4) {
  const supabase = await createClient();
  const { data: dates, error } = await supabase
    .from("important_dates")
    .select("id, title, date, notes")
    .gte("date", todayISODate())
    .order("date", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching upcoming important dates:", error);
    throw error;
  }

  return dates ?? [];
}
