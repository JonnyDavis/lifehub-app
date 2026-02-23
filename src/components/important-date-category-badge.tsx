import {
  importantDateCategoryBadgeClass,
  importantDateCategoryLabel,
} from "@/lib/important-dates/category";
import type { ImportantDateCategory } from "@/types/important-dates";

export function ImportantDateCategoryBadge({
  category,
}: {
  category: ImportantDateCategory;
}) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${importantDateCategoryBadgeClass(
        category,
      )}`}
    >
      {importantDateCategoryLabel(category)}
    </span>
  );
}

