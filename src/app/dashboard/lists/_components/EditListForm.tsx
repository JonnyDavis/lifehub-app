"use client";

import { useState, useTransition } from "react";

import { updateList } from "@/lib/actions/lists";
import { LIST_CATEGORIES, LIST_ICON_KEYS } from "@/types/lists";
import type { ListCategory, ListIconKey, ListView } from "@/types/lists";
import { listCategoryLabel } from "@/lib/presenters/lists";
import { ListIcon } from "@/components/list-icon";

export function EditListForm({
  list,
}: {
  list: ListView;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initialTitle = list.title;
  const initialCategory = list.editorCategory;
  const initialIcon = list.editorIconKey;

  const [title, setTitle] = useState(list.title);
  const [category, setCategory] = useState<ListCategory>(initialCategory);
  const [icon, setIcon] = useState<ListIconKey | null>(initialIcon);

  const cleanTitle = title.trim();
  const isDirty =
    cleanTitle !== initialTitle.trim() ||
    category !== initialCategory ||
    icon !== initialIcon;

  const openEditor = () => {
    setTitle(list.title);
    setCategory(initialCategory);
    setIcon(initialIcon);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!isDirty || cleanTitle.length === 0) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.append("listId", list.id);
      formData.append("title", cleanTitle);
      formData.append("category", category);
      formData.append("icon", icon ?? "");
      await updateList(formData);
      setIsOpen(false);
    });
  };

  return (
    <section className="mt-2">
      <div className="flex justify-end">
        <button
          type="button"
          className="text-sm text-blue-700 hover:underline disabled:opacity-60"
          onClick={() => (isOpen ? setIsOpen(false) : openEditor())}
          disabled={isPending}
          aria-label={isOpen ? "Cancel editing list" : "Edit list"}
        >
          {isOpen ? "Cancel" : "Edit"}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-3 rounded bg-gray-100 p-3">
          <div className="grid gap-3">
            <div>
              <label htmlFor={`list-title-${list.id}`} className="text-sm">
                Title
              </label>
              <input
                id={`list-title-${list.id}`}
                name="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isPending}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-black disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor={`list-category-${list.id}`} className="text-sm">
                Category
              </label>
              <select
                id={`list-category-${list.id}`}
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ListCategory)}
                disabled={isPending}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-black disabled:opacity-60"
              >
                {LIST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {listCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-sm mb-2">Icon</div>
              <div className="flex flex-wrap gap-2 items-center">
                {LIST_ICON_KEYS.map((k) => {
                  const isSelected = icon === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setIcon(k)}
                      disabled={isPending}
                      className={`rounded border px-2 py-2 bg-white hover:bg-gray-50 disabled:opacity-60 ${
                        isSelected
                          ? "border-black ring-1 ring-black"
                          : "border-gray-300"
                      }`}
                      aria-label={`Select icon ${k}`}
                      aria-pressed={isSelected}
                      title={k}
                    >
                      <ListIcon icon={k} className="w-4 h-4 text-gray-900" />
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setIcon(null)}
                  disabled={isPending || icon === null}
                  className="rounded border border-gray-300 px-3 py-2 text-sm bg-white hover:bg-gray-50 disabled:opacity-60"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="text-sm text-gray-700 hover:underline disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending || cleanTitle.length === 0 || !isDirty}
                className="rounded bg-black text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
