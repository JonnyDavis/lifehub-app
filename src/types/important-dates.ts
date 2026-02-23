export const IMPORTANT_DATE_CATEGORIES = [
  "deadline",
  "renewal",
  "event",
  "anniversary",
  "appointment",
  "birthday",
  "other",
] as const;

export type ImportantDateCategory = (typeof IMPORTANT_DATE_CATEGORIES)[number];

export type ImportantDate = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  notes: string | null;
  category: ImportantDateCategory;
  created_at: string;
};

export type UpcomingImportantDate = Omit<ImportantDate, "created_at">;

export const IMPORTANT_DATES_VIEWS = [
  "upcoming",
  "month",
  "all",
  "past",
] as const;

export type ImportantDatesView = (typeof IMPORTANT_DATES_VIEWS)[number];

export function normalizeImportantDatesView(
  value: unknown,
): ImportantDatesView {
  if (value === "month") return "month";
  if (value === "all") return "all";
  if (value === "past") return "past";
  return "upcoming";
}

export function importantDatesViewLabel(view: ImportantDatesView) {
  if (view === "upcoming") return "Upcoming";
  if (view === "month") return "This Month";
  if (view === "past") return "Past";
  return "All";
}
