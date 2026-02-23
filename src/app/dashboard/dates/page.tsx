import { DatesHeader } from "@/app/dashboard/dates/_components/DatesHeader";
import { DatesFilterNav } from "@/app/dashboard/dates/_components/DatesFilterNav";
import { AddImportantDateForm } from "@/app/dashboard/dates/_components/AddImportantDateForm";
import { ImportantDatesList } from "@/app/dashboard/dates/_components/ImportantDatesList";

import { getImportantDatesForView } from "@/lib/queries/important-dates";
import {
  importantDatesViewLabel,
  normalizeImportantDatesView,
} from "@/types/important-dates";

// NOTE: View helpers live in src/types/important-dates.ts to keep query + UI in sync.

type DatesPageProps = {
  searchParams: Promise<{ view?: string; edit?: string }>;
};

export default async function Page({ searchParams }: DatesPageProps) {
  const { view, edit } = await searchParams;
  const selectedView = normalizeImportantDatesView(view);
  const dates = await getImportantDatesForView(selectedView);
  const emptyMessage =
    selectedView === "all" ? "No dates yet. Add one above." : `No dates found.`;

  return (
    <article>
      <DatesHeader />
      <DatesFilterNav selectedView={selectedView} />
      <AddImportantDateForm />
      <ImportantDatesList
        dates={dates}
        selectedView={selectedView}
        editingId={typeof edit === "string" ? edit : undefined}
        title={importantDatesViewLabel(selectedView)}
        emptyMessage={emptyMessage}
      />
    </article>
  );
}
