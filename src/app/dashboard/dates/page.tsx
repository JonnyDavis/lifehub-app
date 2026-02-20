import Link from "next/link";

import {
  createImportantDate,
  deleteImportantDate,
} from "@/lib/actions/important-dates";
import {
  getImportantDatesForView,
  type ImportantDatesView,
} from "@/lib/queries/important-dates";

function formatDateLabel(date: string) {
  const asDate = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(asDate);
}

// normalizeView whitelists onnly the four allowed values; anything else falls back to "upcoming" (the default view)
function normalizeView(value: string | undefined): ImportantDatesView {
  if (value === "month") return "month";
  if (value === "all") return "all";
  if (value === "past") return "past";
  return "upcoming";
}

// viewLabel returns a human-friendly label for the given view, used in the UI.
function viewLabel(view: ImportantDatesView) {
  if (view === "upcoming") return "Upcoming";
  if (view === "month") return "This Month";
  if (view === "past") return "Past";
  return "All";
}

type DatesPageProps = {
  searchParams: Promise<{ view?: string }>;
};

export default async function Page({ searchParams }: DatesPageProps) {
  const { view } = await searchParams;
  const selectedView = normalizeView(view);
  const dates = await getImportantDatesForView(selectedView);
  const emptyMessage =
    selectedView === "all"
      ? "No dates yet. Add one above."
      : `No ${viewLabel(selectedView).toLowerCase()} dates yet. Add one above.`;

  return (
    <article>
      <header className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Important Dates</h1>
          <p className="text-sm text-gray-600">
            Birthdays, appointments, trips—anything you don&apos;t want to miss.
          </p>
        </div>
        <Link href="/dashboard" className="text-blue-500 hover:underline">
          Back to dashboard
        </Link>
      </header>

      <nav aria-label="Date filters" className="flex flex-wrap gap-2 mb-6">
        {(
          [
            ["upcoming", "Upcoming"],
            ["month", "This Month"],
            ["all", "All"],
            ["past", "Past"],
          ] as const
        ).map(([key, label]) => {
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
              {label}
            </Link>
          );
        })}
      </nav>

      <section className="bg-gray-100 p-4 rounded mb-6">
        <h2 className="text-lg text-black font-semibold mb-3">Add a date</h2>
        <form action={createImportantDate} className="grid gap-3">
          <div>
            <label htmlFor="title" className="sr-only">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="Title (e.g., Dentist appointment)"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
            />
          </div>

          <div>
            <label htmlFor="date" className="sr-only">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
            />
          </div>

          <div>
            <label htmlFor="notes" className="sr-only">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              placeholder="Notes (optional)"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
              rows={3}
            />
          </div>

          <div>
            <button
              type="submit"
              className="rounded bg-black text-white px-4 py-2 text-sm font-medium"
            >
              Add date
            </button>
          </div>
        </form>
      </section>

      <section className="bg-gray-200 p-4 rounded text-black">
        <h2 className="text-lg font-semibold mb-3">
          {viewLabel(selectedView)} dates
        </h2>
        {!dates || dates.length === 0 ? (
          <p className="text-gray-600">{emptyMessage}</p>
        ) : (
          <ul className="grid gap-3">
            {dates.map((d) => (
              <li key={d.id} className="bg-gray-300 p-3 rounded">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{d.title}</div>
                    <div className="text-sm text-gray-700">
                      {formatDateLabel(d.date)}
                    </div>
                    {d.notes ? (
                      <div className="text-sm text-gray-700 mt-1">
                        {d.notes}
                      </div>
                    ) : null}
                  </div>
                  <form action={deleteImportantDate}>
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
