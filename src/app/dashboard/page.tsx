// Home page for the dashboard section of the application

import Link from "next/link";
import { getLists } from "@/lib/queries/lists";
import { getUpcomingImportantDates } from "@/lib/queries/important-dates";

function formatDateLabel(date: string) {
  const asDate = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(asDate);
}

export default async function Page() {
  const lists = await getLists();
  const upcomingDates = await getUpcomingImportantDates(4);

  return (
    <>
      <h1 className="sr-only">Dashboard</h1>
      <section
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        aria-labelledby="summary-heading"
      >
        <h2 id="summary-heading" className="sr-only">
          Summary
        </h2>
        <article className="bg-gray-200 p-4 rounded text-black">
          Summary 1
        </article>
        <article className="bg-gray-200 p-4 rounded text-black">
          Summary 2
        </article>
        <article className="bg-gray-200 p-4 rounded text-black">
          Summary 3
        </article>
        <article className="bg-gray-200 p-4 rounded text-black">
          Summary 4
        </article>
      </section>
      <div className="grid md:grid-cols-2 gap-6">
        <section
          className="bg-gray-300 p-4 rounded text-black"
          aria-labelledby="lists-heading"
        >
          <header className="flex items-center justify-between mb-4">
            <h2 id="lists-heading" className="text-lg font-semibold mb-2">
              Lists
            </h2>
            <nav aria-label="Lists">
              <Link
                href="/dashboard/lists"
                className="text-blue-500 hover:underline"
              >
                View All Lists
              </Link>
            </nav>
          </header>
          {!lists || lists.length === 0 ? (
            <p className="text-gray-500">No lists available</p>
          ) : (
            <ul className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
              {lists.map((list) => (
                <li key={list.id}>
                  <Link
                    href={`/dashboard/lists/${list.id}`}
                    className="flex gap-4 bg-gray-200 p-4 rounded text-black"
                  >
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {list.icon ?? list.title[0]}
                    </div>
                    <h2 className="text-lg font-semibold mb-2">{list.title}</h2>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section
          className="bg-gray-200 p-4 rounded text-black"
          aria-labelledby="upcoming-heading"
        >
          <header className="flex items-center justify-between mb-4">
            <h2 id="upcoming-heading" className="text-lg font-semibold">
              Upcoming Dates
            </h2>
            <nav aria-label="Dates">
              <Link
                href="/dashboard/dates"
                className="text-blue-500 hover:underline"
              >
                View All Dates
              </Link>
            </nav>
          </header>
          {!upcomingDates || upcomingDates.length === 0 ? (
            <p className="text-gray-600">
              No upcoming dates.{" "}
              <Link href="/dashboard/dates" className="text-blue-600 underline">
                Add one
              </Link>
              .
            </p>
          ) : (
            <ul className="grid gap-2">
              {upcomingDates.map((d) => (
                <li key={d.id} className="bg-gray-300 p-3 rounded min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate">{d.title}</span>
                    <span className="text-sm text-gray-700 whitespace-nowrap">
                      {formatDateLabel(d.date)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
