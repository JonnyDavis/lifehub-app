// Home page for the dashboard section of the application

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { presentImportantDate } from "@/lib/presenters/important-dates";
import { presentList } from "@/lib/presenters/lists";
import { formatImportantDateLabel } from "@/lib/format/date";
import { ImportantDateCategoryBadge } from "@/components/important-date-category-badge";
import { ListCategoryBadge } from "@/components/list-category-badge";
import { ListAvatar } from "@/components/list-avatar";
import { VisibilityScopeBadge } from "@/components/visibility-scope-badge";
import { getLists } from "@/lib/queries/lists";
import { getUpcomingImportantDates } from "@/lib/queries/important-dates";

export default async function Page() {
  const lists = await getLists();
  const listViews = lists.map(presentList);
  const upcomingDates = await getUpcomingImportantDates(4);

  return (
    <div className="grid gap-6">
      <h1 className="sr-only">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section
          className="bg-gray-200 p-4 rounded text-black"
          aria-labelledby="lists-heading"
        >
          <header className="mb-4 flex items-start justify-between gap-3">
            <h2 id="lists-heading" className="min-w-0 text-lg font-semibold">
              Lists
            </h2>
            <nav aria-label="Lists">
              <Link
                href="/dashboard/lists"
                aria-label="View all lists"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>
          </header>
          {!lists || lists.length === 0 ? (
            <p className="text-gray-500">No lists available</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
              {listViews.map((list) => (
                <li key={list.id}>
                  <Link
                    href={`/dashboard/lists/${list.id}`}
                    className="flex gap-3 rounded bg-gray-300 p-4 text-black"
                  >
                    <ListAvatar avatar={list.avatar} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <h3 className="min-w-0 text-base font-semibold wrap-break-word">
                          {list.title}
                        </h3>
                        {list.badgeCategory ? (
                          <ListCategoryBadge category={list.badgeCategory} />
                        ) : null}
                        <VisibilityScopeBadge scope={list.scope} />
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
          <header className="mb-4 flex items-start justify-between gap-3">
            <h2 id="upcoming-heading" className="min-w-0 text-lg font-semibold">
              Upcoming Dates
            </h2>
            <nav aria-label="Dates">
              <Link
                href="/dashboard/dates"
                aria-label="View all dates"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <ArrowRight className="h-4 w-4" />
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
            <ul className="grid gap-3">
              {upcomingDates.map((d) => {
                const dateView = presentImportantDate(d);
                const category = dateView.category;
                return (
                  <li key={d.id} className="min-w-0 rounded bg-gray-300 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="min-w-0 wrap-break-word">
                          {dateView.title}
                        </span>
                        <ImportantDateCategoryBadge category={category} />
                        <VisibilityScopeBadge scope={dateView.scope} />
                      </span>
                      <span className="text-sm text-gray-700 sm:whitespace-nowrap">
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
    </div>
  );
}
