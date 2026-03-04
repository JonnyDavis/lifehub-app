import { DatesHeader } from "@/app/dashboard/dates/_components/DatesHeader";
import { DatesFilterNav } from "@/app/dashboard/dates/_components/DatesFilterNav";
import { AddImportantDateForm } from "@/app/dashboard/dates/_components/AddImportantDateForm";
import { ImportantDatesList } from "@/app/dashboard/dates/_components/ImportantDatesList";

import { getImportantDatesForView } from "@/lib/queries/important-dates";
import {
  importantDatesViewLabel,
  normalizeImportantDatesView,
} from "@/types/important-dates";
import { normalizeVisibilityFilter, visibilityFilterLabel } from "@/types/visibility";

// NOTE: View helpers live in src/types/important-dates.ts to keep query + UI in sync.

type DatesPageProps = {
  searchParams: Promise<{ view?: string; edit?: string; scope?: string }>;
};

export default async function Page({ searchParams }: DatesPageProps) {
  const { view, edit, scope } = await searchParams;
  const selectedView = normalizeImportantDatesView(view);
  const selectedScope = normalizeVisibilityFilter(scope);
  const dates = await getImportantDatesForView(selectedView, selectedScope);
  const emptyMessage =
    selectedView === "all" ? "No dates yet. Add one above." : `No dates found.`;

  const titleSuffix = selectedScope === "all" ? "" : ` (${visibilityFilterLabel(selectedScope)})`;

  return (
    <article>
      <DatesHeader />
      <DatesFilterNav selectedView={selectedView} selectedScope={selectedScope} />
      <AddImportantDateForm defaultScope={selectedScope} />
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
