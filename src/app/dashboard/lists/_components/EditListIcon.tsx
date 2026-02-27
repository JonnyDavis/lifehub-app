"use client";

import { useEffect, useState, useTransition } from "react";

import { updateListIcon } from "@/lib/actions/lists";
import { ListIcon } from "@/components/list-icon";
import type { ListIconKey } from "@/types/lists";
import { LIST_ICON_KEYS } from "@/types/lists";
import { normalizeListIconKey } from "@/lib/presenters/lists";

export function EditListIcon({
  listId,
  icon,
  className,
}: {
  listId: string;
  icon: string | null;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectedIconFromProps = normalizeListIconKey(icon);
  const [selectedIcon, setSelectedIcon] = useState<ListIconKey | null>(
    selectedIconFromProps,
  );

  useEffect(() => {
    setSelectedIcon(selectedIconFromProps);
  }, [selectedIconFromProps]);

  const submit = (next: ListIconKey | null) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("listId", listId);
      formData.append("icon", next ?? "");
      await updateListIcon(formData);
    });
  };

  const handleSetIcon = (next: ListIconKey) => {
    setSelectedIcon(next);
    setIsOpen(false);
    submit(next);
  };

  const handleReset = () => {
    setSelectedIcon(null);
    setIsOpen(false);
    submit(null);
  };

  return (
    <section className={`flex flex-col items-end ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        <h3 className="sr-only">Icon</h3>
        <button
          type="button"
          className="text-sm text-blue-700 hover:underline disabled:opacity-60"
          onClick={() => setIsOpen((v) => !v)}
          disabled={isPending}
          aria-label={isOpen ? "Cancel icon change" : "Change list icon"}
        >
          {isOpen ? "Cancel" : "Change icon"}
        </button>
      </div>

      {isOpen ? (
        <div className="flex flex-wrap gap-2 items-center justify-end mt-2">
          {LIST_ICON_KEYS.map((k) => {
            const isSelected = selectedIcon === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => handleSetIcon(k)}
                disabled={isPending}
                className={`rounded border px-2 py-2 bg-white hover:bg-gray-50 disabled:opacity-60 ${
                  isSelected
                    ? "border-black ring-1 ring-black"
                    : "border-gray-300"
                }`}
                aria-label={`Set icon to ${k}`}
                aria-pressed={isSelected}
                title={k}
              >
                <ListIcon icon={k} className="w-4 h-4 text-gray-900" />
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleReset}
            disabled={isPending || selectedIcon === null}
            className="rounded border border-gray-300 px-3 py-2 text-sm bg-white hover:bg-gray-50 disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      ) : null}
    </section>
  );
}
