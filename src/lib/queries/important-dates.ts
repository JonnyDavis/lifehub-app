import { createClient } from "@/lib/supabase/server";
import type {
  ImportantDate,
  ImportantDatesView,
  UpcomingImportantDate,
} from "@/types/important-dates";

export type { ImportantDatesView } from "@/types/important-dates";

function toISODateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayISODate() {
  return toISODateLocal(new Date());
}

function currentMonthRangeISO() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toISODateLocal(start), end: toISODateLocal(end) };
}

export async function getImportantDates() {
  const supabase = await createClient();
  const { data: dates, error } = await supabase
    .from("important_dates")
    .select("id, title, date, notes, category, created_at")
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching important dates:", error);
    throw error;
  }

  return (dates ?? []) as ImportantDate[];
}

// This is a simplified version of getImportantDates that only returns the next few upcoming dates, which is used on the dashboard.
export async function getUpcomingImportantDates(limit = 4) {
  const supabase = await createClient();
  const { data: dates, error } = await supabase
    .from("important_dates")
    .select("id, title, date, notes, category")
    .gte("date", todayISODate())
    .order("date", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching upcoming important dates:", error);
    throw error;
  }

  return (dates ?? []) as UpcomingImportantDate[];
}

// This function is more complex because it needs to support multiple views with different filtering and sorting logic.
export async function getImportantDatesForView(view: ImportantDatesView) {
  const supabase = await createClient();
  const today = todayISODate();

  let query = supabase
    .from("important_dates")
    .select("id, title, date, notes, category, created_at");

  if (view === "upcoming") {
    query = query.gte("date", today);
  }

  if (view === "past") {
    query = query.lt("date", today);
  }

  if (view === "month") {
    const { start, end } = currentMonthRangeISO();
    query = query.gte("date", start).lte("date", end);
  }

  const { data: dates, error } =
    view === "past"
      ? await query.order("date", { ascending: false }).order("created_at", {
          ascending: false,
        })
      : await query.order("date", { ascending: true }).order("created_at", {
          ascending: true,
        });

  if (error) {
    console.error("Error fetching important dates:", error);
    throw error;
  }

  return (dates ?? []) as ImportantDate[];
}
