import type { List, ListItem } from "@/types/lists";

export function listAvatarText(list: Pick<List, "icon" | "title">) {
  return list.icon ?? list.title[0];
}

export function splitListItemsByDone(items: ListItem[]) {
  const todoItems = items.filter((item) => !item.is_done);
  const doneItems = items.filter((item) => item.is_done);
  return { todoItems, doneItems };
}
