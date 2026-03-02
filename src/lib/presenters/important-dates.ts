import {
  IMPORTANT_DATE_CATEGORIES,
  type ImportantDateCategory,
} from "@/types/important-dates";
import type { ImportantDate, ImportantDateView } from "@/types/important-dates";

export function normalizeImportantDateCategory(
  value: unknown,
): ImportantDateCategory {
  if (typeof value !== "string") return "other";
  const candidate = value.trim().toLowerCase();
  if (IMPORTANT_DATE_CATEGORIES.includes(candidate as ImportantDateCategory)) {
    return candidate as ImportantDateCategory;
  }
  return "other";
}

export function importantDateCategoryLabel(category: ImportantDateCategory) {
  if (category === "deadline") return "Deadline";
  if (category === "renewal") return "Renewal";
  if (category === "event") return "Event";
  if (category === "anniversary") return "Anniversary";
  if (category === "appointment") return "Appointment";
  if (category === "birthday") return "Birthday";
  return "Other";
}

export function importantDateCategoryBadgeClass(
  category: ImportantDateCategory,
) {
  if (category === "deadline") return "bg-red-200 text-red-900";
  if (category === "renewal") return "bg-amber-200 text-amber-900";
  if (category === "event") return "bg-blue-200 text-blue-900";
  if (category === "anniversary") return "bg-purple-200 text-purple-900";
  if (category === "appointment") return "bg-green-200 text-green-900";
  if (category === "birthday") return "bg-pink-200 text-pink-900";
  return "bg-gray-200 text-gray-900";
}

/**
 * Convert a DB-ish important date into a UI-friendly view model.
 *
 * This matches the `presentList()` pattern:
 * - normalization/defaulting happens once here
 * - UI can render from the returned plain JS object
 */
export function presentImportantDate(
  date: Pick<ImportantDate, "id" | "title" | "date" | "notes" | "category">,
): ImportantDateView {
  return {
    id: date.id,
    title: date.title,
    date: date.date,
    notes: date.notes,
    category: normalizeImportantDateCategory(date.category),
  };
}
