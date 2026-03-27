import { DatesHeader } from "@/app/dashboard/dates/_components/DatesHeader";
import { DatesFilterNav } from "@/app/dashboard/dates/_components/DatesFilterNav";
import { AddImportantDateForm } from "@/app/dashboard/dates/_components/AddImportantDateForm";
import { ImportantDatesList } from "@/app/dashboard/dates/_components/ImportantDatesList";

import { getImportantDatesForView } from "@/lib/queries/important-dates";
import {
  importantDatesViewLabel,
  normalizeImportantDatesView,
} from "@/types/important-dates";
import {
  normalizeVisibilityFilter,
  visibilityFilterLabel,
} from "@/types/visibility";

// NOTE: View helpers live in src/types/important-dates.ts to keep query + UI in sync.

type DatesPageProps = {
  searchParams: Promise<{
    view?: string;
    edit?: string;
    scope?: string;
    created?: string;
    error?: string;
  }>;
};

export default async function Page({ searchParams }: DatesPageProps) {
  const { view, edit, scope, created, error } = await searchParams;
  const selectedView = normalizeImportantDatesView(view);
  const selectedScope = normalizeVisibilityFilter(scope);
  const dates = await getImportantDatesForView(selectedView, selectedScope);
  const emptyMessage =
    selectedView === "all" ? "No dates yet. Add one above." : `No dates found.`;

  const titleSuffix =
    selectedScope === "all" ? "" : ` (${visibilityFilterLabel(selectedScope)})`;
  const createMessage =
    created === "1"
      ? {
          tone: "success" as const,
          text: "Date added.",
        }
      : error === "missing_title"
        ? {
            tone: "error" as const,
            text: "Add a title before saving the date.",
          }
        : error === "missing_date"
          ? {
              tone: "error" as const,
              text: "Choose a date before saving.",
            }
          : error === "create_failed"
            ? {
                tone: "error" as const,
                text: "We couldn't add that date. Please try again.",
              }
            : null;

  return (
    <article>
      <DatesHeader />
      <DatesFilterNav
        selectedView={selectedView}
        selectedScope={selectedScope}
      />
      {/* Create redirects feed back into this page through query params instead of local client state. */}
      {createMessage ? (
        <section
          className={
            createMessage.tone === "success"
              ? "mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900"
              : "mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-900"
          }
        >
          {createMessage.text}
        </section>
      ) : null}
      <AddImportantDateForm
        defaultScope={selectedScope}
        selectedView={selectedView}
      />
      <ImportantDatesList
        dates={dates}
        selectedView={selectedView}
        selectedScope={selectedScope}
        editingId={typeof edit === "string" ? edit : undefined}
        title={`${importantDatesViewLabel(selectedView)}${titleSuffix}`}
        emptyMessage={emptyMessage}
      />
    </article>
  );
}
