import { deleteImportantDate } from "@/lib/actions/important-dates";
import { formatImportantDateLabel, relativeImportantDateDistanceLabel } from "@/lib/format/date";
import { normalizeImportantDateCategory } from "@/lib/presenters/important-dates";
import { ImportantDateCategoryBadge } from "@/components/important-date-category-badge";
import type { ImportantDate } from "@/types/important-dates";

function ImportantDateCard({ date }: { date: ImportantDate }) {
  const category = normalizeImportantDateCategory(date.category);

  return (
    <li className="bg-gray-300 p-3 rounded">
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
        <form action={deleteImportantDate}>
          <input type="hidden" name="id" value={date.id} />
          <button type="submit" className="text-sm text-blue-600 hover:underline">
            Delete
          </button>
        </form>
      </div>
    </li>
  );
}

export function ImportantDatesList({
  dates,
  title,
  emptyMessage,
}: {
  dates: ImportantDate[];
  title: string;
  emptyMessage: string;
}) {
  return (
    <section className="bg-gray-200 p-4 rounded text-black">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      {!dates || dates.length === 0 ? (
        <p className="text-gray-600">{emptyMessage}</p>
      ) : (
        <ul className="grid gap-3">
          {dates.map((d) => (
            <ImportantDateCard key={d.id} date={d} />
          ))}
        </ul>
      )}
    </section>
  );
}

