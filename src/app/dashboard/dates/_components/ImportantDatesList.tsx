import Link from "next/link";

import { deleteImportantDate } from "@/lib/actions/important-dates";
import {
  formatImportantDateLabel,
  relativeImportantDateDistanceLabel,
} from "@/lib/format/date";
import { presentImportantDate } from "@/lib/presenters/important-dates";
import { ImportantDateCategoryBadge } from "@/components/important-date-category-badge";
import type {
  ImportantDate,
  ImportantDatesView,
  ImportantDateView,
} from "@/types/important-dates";
import { EditImportantDateForm } from "@/app/dashboard/dates/_components/EditImportantDateForm";

function ViewImportantDateCard({
  date,
  selectedView,
}: {
  date: ImportantDateView;
  selectedView: ImportantDatesView;
}) {
  const category = date.category;
  const anchorId = `date-${date.id}`;

  return (
    <li id={anchorId} className="bg-gray-300 p-3 rounded scroll-mt-24">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="font-medium truncate">{date.title}</div>
            <ImportantDateCategoryBadge category={category} />
          </div>
          <div className="text-sm text-gray-700">
            {formatImportantDateLabel(date.date)}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            🕒 {relativeImportantDateDistanceLabel(date.date)}
          </div>
          {date.notes ? (
            <div className="text-sm text-gray-700 mt-1">{date.notes}</div>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Link
            href={`/dashboard/dates?view=${selectedView}&edit=${date.id}#${anchorId}`}
            className="text-sm text-blue-600 hover:underline"
            scroll={false}
          >
            Edit
          </Link>
          <form action={deleteImportantDate}>
            <input type="hidden" name="id" value={date.id} />
            <button
              type="submit"
              className="text-sm text-blue-600 hover:underline"
            >
              Delete
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
  editingId,
  title,
  emptyMessage,
}: {
  dates: ImportantDate[];
  selectedView: ImportantDatesView;
  editingId?: string;
  title: string;
  emptyMessage: string;
}) {
  const dateViews = dates.map(presentImportantDate);

  return (
    <section className="bg-gray-200 p-4 rounded text-black">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {!dates || dates.length === 0 ? (
        <p className="text-gray-600">{emptyMessage}</p>
      ) : (
        <ul className="grid gap-3">
          {dateViews.map((d) =>
            editingId === d.id ? (() => {
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
                    />
                    <form action={deleteImportantDate} className="flex justify-end">
                      <input type="hidden" name="id" value={d.id} />
                      <button
                        type="submit"
                        className="text-sm text-red-700 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              );
            })() : (
              <ViewImportantDateCard key={d.id} date={d} selectedView={selectedView} />
            ),
          )}
        </ul>
      )}
    </section>
  );
}
