"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Clock3 } from "lucide-react";

import { updateImportantDate } from "@/lib/actions/important-dates";
import { ImportantDateCategoryBadge } from "@/components/important-date-category-badge";
import {
  formatImportantDateLabel,
  relativeImportantDateDistanceLabel,
} from "@/lib/format/date";
import { IMPORTANT_DATE_CATEGORIES } from "@/types/important-dates";
import type {
  ImportantDateView,
  ImportantDatesView,
} from "@/types/important-dates";
import { importantDateCategoryLabel } from "@/lib/presenters/important-dates";
import {
  VISIBILITY_SCOPES,
  type VisibilityFilter,
  type VisibilityScope,
} from "@/types/visibility";
import { VisibilityScopeBadge } from "@/components/visibility-scope-badge";

export function EditImportantDateForm({
  date,
  selectedView,
  selectedScope,
}: {
  date: ImportantDateView;
  selectedView: ImportantDatesView;
  selectedScope: VisibilityFilter;
}) {
  const [isPending, startTransition] = useTransition();

  const initialTitle = date.title;
  const initialDate = date.date;
  const initialNotes = date.notes ?? "";
  const initialCategory = date.category;
  const initialScope = date.scope;

  const [title, setTitle] = useState(initialTitle);
  const [dateValue, setDateValue] = useState(initialDate);
  const [category, setCategory] = useState(initialCategory);
  const [notes, setNotes] = useState(initialNotes);
  const [scope, setScope] = useState<VisibilityScope>(initialScope);

  const cleanTitle = title.trim();
  const cleanDate = dateValue.trim();
  const cleanNotes = notes.trim();

  const isDirty =
    cleanTitle !== initialTitle.trim() ||
    cleanDate !== initialDate ||
    category !== initialCategory ||
    cleanNotes !== initialNotes.trim() ||
    scope !== initialScope;

  const anchorId = `date-${date.id}`;
  const scopeQuery = selectedScope === "all" ? "" : `&scope=${selectedScope}`;

  const handleSave = () => {
    if (!isDirty || cleanTitle.length === 0 || cleanDate.length === 0) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", date.id);
      formData.append("view", selectedView);
      formData.append("scopeFilter", selectedScope);
      formData.append("title", cleanTitle);
      formData.append("date", cleanDate);
      formData.append("category", category);
      formData.append("notes", cleanNotes);
      formData.append("scope", scope);
      await updateImportantDate(formData);
    });
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="font-medium">Editing</div>
            <ImportantDateCategoryBadge category={category} />
            <VisibilityScopeBadge scope={scope} />
          </div>
          <div className="text-sm text-gray-700">
            {formatImportantDateLabel(cleanDate)}
          </div>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs text-gray-700">
              <Clock3 className="h-4 w-4" />
              {relativeImportantDateDistanceLabel(cleanDate)}
            </span>
          </div>
        </div>
      </div>

      <form
        className="grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <div>
          <label htmlFor={`title-${date.id}`} className="sr-only">
            Title
          </label>
          <input
            id={`title-${date.id}`}
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isPending}
            className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm disabled:opacity-60"
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
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              disabled={isPending}
              className="block w-full appearance-none rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm disabled:opacity-60"
              style={{ WebkitAppearance: "none" }}
            />
          </div>

          <div>
            <label htmlFor={`category-${date.id}`} className="sr-only">
              Category
            </label>
            <select
              id={`category-${date.id}`}
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              disabled={isPending}
              className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm disabled:opacity-60"
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
          <label htmlFor={`scope-${date.id}`} className="sr-only">
            Visibility
          </label>
          <select
            id={`scope-${date.id}`}
            name="scope"
            value={scope}
            onChange={(e) => setScope(e.target.value as VisibilityScope)}
            disabled={isPending}
            className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm disabled:opacity-60"
          >
            {VISIBILITY_SCOPES.map((s) => (
              <option key={s} value={s}>
                {s === "personal" ? "Personal" : "Household"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`notes-${date.id}`} className="sr-only">
            Notes
          </label>
          <textarea
            id={`notes-${date.id}`}
            name="notes"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm disabled:opacity-60"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/dashboard/dates?view=${selectedView}${scopeQuery}#${anchorId}`}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            scroll={false}
            aria-disabled={isPending}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={
              isPending ||
              !isDirty ||
              cleanTitle.length === 0 ||
              cleanDate.length === 0
            }
            className="rounded bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </form>
    </>
  );
}
