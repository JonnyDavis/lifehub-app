import Link from "next/link";

import {
  IMPORTANT_DATES_VIEWS,
  importantDatesViewLabel,
  type ImportantDatesView,
} from "@/types/important-dates";

export function DatesFilterNav({
  selectedView,
}: {
  selectedView: ImportantDatesView;
}) {
  return (
    <nav aria-label="Date filters" className="flex flex-wrap gap-2 mb-6">
      {IMPORTANT_DATES_VIEWS.map((key) => {
        const active = selectedView === key;
        return (
          <Link
            key={key}
            href={`/dashboard/dates?view=${key}`}
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
    </nav>
  );
}

