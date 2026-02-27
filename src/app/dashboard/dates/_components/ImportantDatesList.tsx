import Link from "next/link";

import {
  deleteImportantDate,
  updateImportantDate,
} from "@/lib/actions/important-dates";
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
import { IMPORTANT_DATE_CATEGORIES } from "@/types/important-dates";
import { importantDateCategoryLabel } from "@/lib/presenters/important-dates";

function EditImportantDateCard({
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
      <div className="grid gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="font-medium truncate">Editing</div>
              <ImportantDateCategoryBadge category={category} />
            </div>
            <div className="text-sm text-gray-700">
              {formatImportantDateLabel(date.date)}
            </div>
          </div>
          <Link
            href={`/dashboard/dates?view=${selectedView}#${anchorId}`}
            className="text-sm text-blue-600 hover:underline"
            scroll={false}
          >
            Cancel
          </Link>
        </div>

        <form action={updateImportantDate} className="grid gap-2">
          <input type="hidden" name="id" value={date.id} />
          <input type="hidden" name="view" value={selectedView} />

          <div>
            <label htmlFor={`title-${date.id}`} className="sr-only">
              Title
            </label>
            <input
              id={`title-${date.id}`}
              name="title"
              type="text"
              required
              defaultValue={date.title}
              className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-2">
            <div>
              <label htmlFor={`date-${date.id}`} className="sr-only">
                Date
              </label>
              <input
                id={`date-${date.id}`}
                name="date"
                type="date"
                required
                defaultValue={date.date}
                className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm"
              />
            </div>

            <div>
              <label htmlFor={`category-${date.id}`} className="sr-only">
                Category
              </label>
              <select
                id={`category-${date.id}`}
                name="category"
                defaultValue={category}
                className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm"
              >
                {IMPORTANT_DATE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {importantDateCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor={`notes-${date.id}`} className="sr-only">
              Notes
            </label>
            <textarea
              id={`notes-${date.id}`}
              name="notes"
              placeholder="Notes (optional)"
              defaultValue={date.notes ?? ""}
              className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              className="rounded bg-black text-white px-4 py-2 text-sm font-medium"
            >
              Save
            </button>
          </div>
        </form>

        <form action={deleteImportantDate} className="flex justify-end">
          <input type="hidden" name="id" value={date.id} />
          <button type="submit" className="text-sm text-red-700 hover:underline">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}

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
            editingId === d.id ? (
              <EditImportantDateCard
                key={d.id}
                date={d}
                selectedView={selectedView}
              />
            ) : (
              <ViewImportantDateCard
                key={d.id}
                date={d}
                selectedView={selectedView}
              />
            ),
          )}
        </ul>
      )}
    </section>
  );
}
