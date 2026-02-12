"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleListItem } from "@/app/dashboard/lists/actions";

type ToggleItemCheckboxProps = {
  itemId: string;
  listId: string;
  done: boolean;
};

export function ToggleItemCheckbox({
  itemId,
  listId,
  done,
}: ToggleItemCheckboxProps) {
  const [isPending, startTransition] = useTransition();
  const [checked, setChecked] = useState(done);

  // Keep local state in sync if the server sends a new value
  useEffect(() => {
    setChecked(done);
  }, [done]);

  const handleChange = () => {
    const next = !checked;
    setChecked(next);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("listId", listId);
      formData.append("nextDone", String(next));

      await toggleListItem(formData);
    });
  };

  return (
    <input
      type="checkbox"
      name={`item-done-${itemId}`}
      className="w-4 h-4"
      checked={checked}
      disabled={isPending}
      onChange={handleChange}
    />
  );
}
