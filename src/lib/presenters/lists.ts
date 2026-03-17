import { LIST_CATEGORIES, LIST_ICON_KEYS } from "@/types/lists";
import type { ListCategory, ListIconKey } from "@/types/lists";
import type { List, ListAvatarView, ListItem, ListView } from "@/types/lists";

export function listAvatarText(list: Pick<List, "title">) {
  return list.title[0];
}

function isReasonableIconText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 4;
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

/**
 * Convert a DB-ish `List` shape (nullable/unknown strings) into a UI-friendly view model.
 *
 * Notes (especially if you're coming from vanilla JS):
 * - `Pick<List, ...>` is just saying "this function only needs these fields".
 * - `: ListView` is compile-time only: it forces the returned plain JS object to match
 *   the `ListView` type (it does not exist at runtime).
 * - The goal is to compute all normalization/defaulting once, so UI components can
 *   simply read `listView.title`, `listView.badgeCategory`, `listView.avatar`, etc.
 */
export function presentList(
  list: Pick<List, "id" | "title" | "category" | "icon" | "scope">,
): ListView {
  // For display: only a valid/known category should show a badge or influence defaults.
  const badgeCategory = normalizeListCategory(list.category);

  // For editing: always provide a valid select value (falls back to "other").
  const editorCategory = badgeCategory ?? "other";

  // For both editing and avatar rendering: only accept known icon keys.
  const editorIconKey = normalizeListIconKey(list.icon);

  const avatar: ListAvatarView = (() => {
    // Priority 1: known icon key (e.g. "shopping-cart").
    if (editorIconKey) return { kind: "icon", icon: editorIconKey };

    // Priority 2: short custom icon text stored in `lists.icon` (e.g. "WFH").
    const customIconText =
      typeof list.icon === "string" &&
      isReasonableIconText(list.icon) &&
      editorIconKey === null
        ? list.icon.trim()
        : null;

    if (customIconText) return { kind: "text", text: customIconText };

    // Priority 3: category-based default icon (only when category is valid).
    const fallbackIconKey = badgeCategory
      ? defaultListIconKey(badgeCategory)
      : null;

    if (fallbackIconKey) return { kind: "icon", icon: fallbackIconKey };

    // Priority 4: final fallback is the first letter of the title.
    return { kind: "text", text: listAvatarText(list) };
  })();

  return {
    // This is a plain JS object at runtime; TypeScript checks its shape at build time.
    id: list.id,
    title: list.title,
    badgeCategory,
    editorCategory,
    editorIconKey,
    scope: list.scope,
    avatar,
  };
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
