import Link from "next/link";
import { Clock3, Pencil, Trash2 } from "lucide-react";

import { deleteImportantDate } from "@/lib/actions/important-dates";
import {
  formatImportantDateLabel,
  relativeImportantDateDistanceLabel,
} from "@/lib/format/date";
import { presentImportantDate } from "@/lib/presenters/important-dates";
import { ImportantDateCategoryBadge } from "@/components/important-date-category-badge";
import { VisibilityScopeBadge } from "@/components/visibility-scope-badge";
import type {
  ImportantDate,
  ImportantDatesView,
  ImportantDateView,
} from "@/types/important-dates";
import { EditImportantDateForm } from "@/app/dashboard/dates/_components/EditImportantDateForm";
import type { VisibilityFilter } from "@/types/visibility";

function ViewImportantDateCard({
  date,
  selectedView,
  selectedScope,
}: {
  date: ImportantDateView;
  selectedView: ImportantDatesView;
  selectedScope: VisibilityFilter;
}) {
  const category = date.category;
  const anchorId = `date-${date.id}`;
  const scopeQuery = selectedScope === "all" ? "" : `&scope=${selectedScope}`;
  const iconButtonClass =
    "inline-flex h-10 w-10 items-center justify-center rounded leading-none";

  return (
    <li id={anchorId} className="bg-gray-300 p-3 rounded scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="font-medium wrap-break-word">{date.title}</div>
            <ImportantDateCategoryBadge category={category} />
            <VisibilityScopeBadge scope={date.scope} />
          </div>
          <div className="text-sm text-gray-700">
            {formatImportantDateLabel(date.date)}
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">
              <Clock3 className="h-4 w-4" />
              {relativeImportantDateDistanceLabel(date.date)}
            </span>
          </div>
          {date.notes ? (
            <div className="mt-3 text-sm text-gray-700">{date.notes}</div>
          ) : null}
        </div>
        <div className="flex w-full justify-end gap-4 sm:gap-2 shrink-0 sm:w-auto sm:self-start">
          <Link
            href={`/dashboard/dates?view=${selectedView}${scopeQuery}&edit=${date.id}#${anchorId}`}
            className={`${iconButtonClass} text-blue-700 hover:bg-blue-50`}
            scroll={false}
            aria-label={`Edit ${date.title}`}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Link>
          <form action={deleteImportantDate}>
            <input type="hidden" name="id" value={date.id} />
            <button
              type="submit"
              className={`${iconButtonClass} text-red-700 hover:bg-red-50`}
              aria-label={`Delete ${date.title}`}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

export function ImportantDatesList({
  dates,
  selectedView,
  selectedScope,
  editingId,
  title,
  emptyMessage,
}: {
  dates: ImportantDate[];
  selectedView: ImportantDatesView;
  selectedScope: VisibilityFilter;
  editingId?: string;
  title: string;
  emptyMessage: string;
}) {
  const dateViews = dates.map(presentImportantDate);
  const iconButtonClass =
    "inline-flex h-10 w-10 items-center justify-center rounded leading-none";

  return (
    <section className="bg-gray-200 p-4 rounded text-black">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {!dates || dates.length === 0 ? (
        <p className="text-gray-600">{emptyMessage}</p>
      ) : (
        <ul className="grid gap-3">
          {dateViews.map((d) =>
            editingId === d.id ? (
              (() => {
                const anchorId = `date-${d.id}`;
                return (
                  <li
                    key={d.id}
                    id={anchorId}
                    className="bg-gray-300 p-3 rounded scroll-mt-24"
                  >
                    <div className="grid gap-3">
                      <EditImportantDateForm
                        date={d}
                        selectedView={selectedView}
                        selectedScope={selectedScope}
                      />
                      <form
                        action={deleteImportantDate}
                        className="flex justify-end"
                      >
                        <input type="hidden" name="id" value={d.id} />
                        <button
                          type="submit"
                          className={`${iconButtonClass} text-red-700 hover:bg-red-50`}
                          aria-label={`Delete ${d.title}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </li>
                );
              })()
            ) : (
              <ViewImportantDateCard
                key={d.id}
                date={d}
                selectedView={selectedView}
                selectedScope={selectedScope}
              />
            ),
          )}
        </ul>
      )}
    </section>
  );
}
