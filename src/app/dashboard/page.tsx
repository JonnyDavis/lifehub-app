// Home page for the dashboard section of the application

import Link from "next/link";
import { presentImportantDate } from "@/lib/presenters/important-dates";
import { presentList } from "@/lib/presenters/lists";
import { formatImportantDateLabel } from "@/lib/format/date";
import { ImportantDateCategoryBadge } from "@/components/important-date-category-badge";
import { ListCategoryBadge } from "@/components/list-category-badge";
import { ListAvatar } from "@/components/list-avatar";
import { getLists } from "@/lib/queries/lists";
import { getUpcomingImportantDates } from "@/lib/queries/important-dates";

export default async function Page() {
  const lists = await getLists();
  const listViews = lists.map(presentList);
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
              {listViews.map((list) => (
                <li key={list.id}>
                  <Link
                    href={`/dashboard/lists/${list.id}`}
                    className="flex gap-4 bg-gray-200 p-4 rounded text-black"
                  >
                    <ListAvatar avatar={list.avatar} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <h2 className="text-lg font-semibold mb-2 truncate">
                          {list.title}
                        </h2>
                        {list.badgeCategory ? (
                          <ListCategoryBadge category={list.badgeCategory} />
                        ) : null}
                      </div>
                    </div>
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
              {upcomingDates.map((d) => {
                const dateView = presentImportantDate(d);
                const category = dateView.category;
                return (
                  <li key={d.id} className="bg-gray-300 p-3 rounded min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="min-w-0 truncate">
                          {dateView.title}
                        </span>
                        <ImportantDateCategoryBadge category={category} />
                      </span>
                      <span className="text-sm text-gray-700 whitespace-nowrap">
                        {formatImportantDateLabel(dateView.date)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
