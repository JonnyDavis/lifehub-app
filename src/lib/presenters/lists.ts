import { LIST_CATEGORIES, LIST_ICON_KEYS } from "@/types/lists";
import type { ListCategory, ListIconKey } from "@/types/lists";
import type { List, ListItem } from "@/types/lists";

export function listAvatarText(list: Pick<List, "title">) {
  return list.title[0];
}

export function normalizeListCategory(value: unknown): ListCategory | null {
  if (typeof value !== "string") return null;
  const candidate = value.trim().toLowerCase();
  if (LIST_CATEGORIES.includes(candidate as ListCategory)) {
    return candidate as ListCategory;
  }
  return null;
}

export function normalizeListIconKey(value: unknown): ListIconKey | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  const candidate = trimmed.toLowerCase();
  if (LIST_ICON_KEYS.includes(candidate as ListIconKey)) {
    return candidate as ListIconKey;
  }
  return null;
}

export function defaultListIconKey(category: ListCategory): ListIconKey {
  if (category === "shopping") return "shopping-cart";
  if (category === "chores") return "list-checks";
  if (category === "errands") return "map-pin";
  if (category === "packing") return "backpack";
  if (category === "maintenance") return "wrench";
  if (category === "projects") return "folder-kanban";
  if (category === "wishlist") return "heart";
  return "tag";
}

export function listCategoryLabel(category: ListCategory) {
  if (category === "shopping") return "Shopping";
  if (category === "chores") return "Chores";
  if (category === "errands") return "Errands";
  if (category === "packing") return "Packing";
  if (category === "maintenance") return "Maintenance";
  if (category === "projects") return "Projects";
  if (category === "wishlist") return "Wishlist";
  return "Other";
}

export function listCategoryBadgeClass(category: ListCategory) {
  if (category === "shopping") return "bg-green-200 text-green-900";
  if (category === "chores") return "bg-blue-200 text-blue-900";
  if (category === "errands") return "bg-indigo-200 text-indigo-900";
  if (category === "packing") return "bg-amber-200 text-amber-900";
  if (category === "maintenance") return "bg-red-200 text-red-900";
  if (category === "projects") return "bg-purple-200 text-purple-900";
  if (category === "wishlist") return "bg-pink-200 text-pink-900";
  return "bg-gray-200 text-gray-900";
}

export function splitListItemsByDone(items: ListItem[]) {
  const todoItems = items.filter((item) => !item.is_done);
  const doneItems = items.filter((item) => item.is_done);
  return { todoItems, doneItems };
}
