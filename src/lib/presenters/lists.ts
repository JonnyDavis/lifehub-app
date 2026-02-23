import type { List, ListCategory, ListItem } from "@/types/lists";

export function listAvatarText(list: Pick<List, "icon" | "title">) {
  return list.icon ?? list.title[0];
}

export function listCategoryLabel(category: ListCategory) {
  if (category === "shopping") return "Shopping";
  if (category === "tasks") return "Tasks";
  if (category === "packing") return "Packing";
  return "Goals";
}

export function listCategoryBadgeClass(category: ListCategory) {
  if (category === "shopping") return "bg-green-200 text-green-900";
  if (category === "tasks") return "bg-blue-200 text-blue-900";
  if (category === "packing") return "bg-amber-200 text-amber-900";
  return "bg-purple-200 text-purple-900";
}

export function splitListItemsByDone(items: ListItem[]) {
  const todoItems = items.filter((item) => !item.is_done);
  const doneItems = items.filter((item) => item.is_done);
  return { todoItems, doneItems };
}
