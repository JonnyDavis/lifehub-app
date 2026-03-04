import Link from "next/link";

import {
  IMPORTANT_DATES_VIEWS,
  importantDatesViewLabel,
  type ImportantDatesView,
} from "@/types/important-dates";
import {
  VISIBILITY_FILTERS,
  type VisibilityFilter,
  visibilityFilterLabel,
} from "@/types/visibility";

export function DatesFilterNav({
  selectedView,
  selectedScope,
}: {
  selectedView: ImportantDatesView;
  selectedScope: VisibilityFilter;
}) {
  return (
    <nav aria-label="Date filters" className="flex flex-col gap-3 mb-6">
      <div className="flex flex-wrap gap-2">
        {IMPORTANT_DATES_VIEWS.map((key) => {
          const active = selectedView === key;
          const scopeQuery =
            selectedScope === "all" ? "" : `&scope=${selectedScope}`;
          return (
            <Link
              key={key}
              href={`/dashboard/dates?view=${key}${scopeQuery}`}
              className={
                active
                  ? "rounded bg-black text-white px-3 py-1.5 text-sm font-medium"
                  : "rounded bg-gray-200 text-black px-3 py-1.5 text-sm hover:bg-gray-300"
              }
              aria-current={active ? "page" : undefined}
            >
              {importantDatesViewLabel(key)}
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {VISIBILITY_FILTERS.map((key) => {
          const active = selectedScope === key;
          const scopeQuery = key === "all" ? "" : `&scope=${key}`;
          return (
            <Link
              key={key}
              href={`/dashboard/dates?view=${selectedView}${scopeQuery}`}
              className={
                active
                  ? "rounded bg-black text-white px-3 py-1.5 text-sm font-medium"
                  : "rounded bg-gray-200 text-black px-3 py-1.5 text-sm hover:bg-gray-300"
              }
              aria-current={active ? "page" : undefined}
            >
              {visibilityFilterLabel(key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
