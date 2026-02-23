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
