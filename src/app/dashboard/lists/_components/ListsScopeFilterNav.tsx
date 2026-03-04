import Link from "next/link";

import {
  VISIBILITY_FILTERS,
  type VisibilityFilter,
  visibilityFilterLabel,
} from "@/types/visibility";

export function ListsScopeFilterNav({
  selectedScope,
}: {
  selectedScope: VisibilityFilter;
}) {
  return (
    <nav aria-label="List visibility filters" className="flex flex-wrap gap-2 mb-6">
      {VISIBILITY_FILTERS.map((key) => {
        const active = selectedScope === key;
        const scopeQuery = key === "all" ? "" : `?scope=${key}`;
        return (
          <Link
            key={key}
            href={`/dashboard/lists${scopeQuery}`}
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
    </nav>
  );
}

