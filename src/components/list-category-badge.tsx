import {
  listCategoryBadgeClass,
  listCategoryLabel,
} from "@/lib/presenters/lists";
import type { ListCategory } from "@/types/lists";

export function ListCategoryBadge({ category }: { category: ListCategory }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${listCategoryBadgeClass(
        category,
      )}`}
    >
      {listCategoryLabel(category)}
    </span>
  );
}

