"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { updateImportantDate } from "@/lib/actions/important-dates";
import { ImportantDateCategoryBadge } from "@/components/important-date-category-badge";
import {
  formatImportantDateLabel,
  relativeImportantDateDistanceLabel,
} from "@/lib/format/date";
import { IMPORTANT_DATE_CATEGORIES } from "@/types/important-dates";
import type { ImportantDateView, ImportantDatesView } from "@/types/important-dates";
import { importantDateCategoryLabel } from "@/lib/presenters/important-dates";

export function EditImportantDateForm({
  date,
  selectedView,
}: {
  date: ImportantDateView;
  selectedView: ImportantDatesView;
}) {
  const [isPending, startTransition] = useTransition();

  const initialTitle = date.title;
  const initialDate = date.date;
  const initialNotes = date.notes ?? "";
  const initialCategory = date.category;

  const [title, setTitle] = useState(initialTitle);
  const [dateValue, setDateValue] = useState(initialDate);
  const [category, setCategory] = useState(initialCategory);
  const [notes, setNotes] = useState(initialNotes);

  const cleanTitle = title.trim();
  const cleanDate = dateValue.trim();
  const cleanNotes = notes.trim();

  const isDirty =
    cleanTitle !== initialTitle.trim() ||
    cleanDate !== initialDate ||
    category !== initialCategory ||
    cleanNotes !== initialNotes.trim();

  const anchorId = `date-${date.id}`;

  const handleSave = () => {
    if (!isDirty || cleanTitle.length === 0 || cleanDate.length === 0) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", date.id);
      formData.append("view", selectedView);
      formData.append("title", cleanTitle);
      formData.append("date", cleanDate);
      formData.append("category", category);
      formData.append("notes", cleanNotes);
      await updateImportantDate(formData);
    });
  };

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="font-medium truncate">Editing</div>
            <ImportantDateCategoryBadge category={category} />
          </div>
          <div className="text-sm text-gray-700">
            {formatImportantDateLabel(cleanDate)}
          </div>
          <div className="text-sm text-gray-700 mt-1">
            🕒 {relativeImportantDateDistanceLabel(cleanDate)}
          </div>
        </div>
        <Link
          href={`/dashboard/dates?view=${selectedView}#${anchorId}`}
          className="text-sm text-blue-600 hover:underline"
          scroll={false}
          aria-disabled={isPending}
        >
          Cancel
        </Link>
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
              className="w-full rounded border border-gray-400 bg-white px-3 py-2 text-sm text-black shadow-sm disabled:opacity-60"
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
          <button
            type="submit"
            disabled={isPending || !isDirty || cleanTitle.length === 0 || cleanDate.length === 0}
            className="rounded bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </form>
    </>
  );
}

