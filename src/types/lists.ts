// Type definitions for lists

import type { VisibilityScope } from "@/types/visibility";

export const LIST_CATEGORIES = [
  "shopping",
  "chores",
  "errands",
  "packing",
  "maintenance",
  "projects",
  "wishlist",
  "other",
] as const;

export type ListCategory = (typeof LIST_CATEGORIES)[number];

export const LIST_ICON_KEYS = [
  "shopping-cart",
  "list-checks",
  "map-pin",
  "backpack",
  "wrench",
  "folder-kanban",
  "heart",
  "tag",
] as const;

export type ListIconKey = (typeof LIST_ICON_KEYS)[number];

export type List = {
  id: string;
  title: string;
  icon: string | null;
  category: string | null;
  scope: VisibilityScope;
};

export type ListAvatarView =
  | { kind: "icon"; icon: ListIconKey }
  | { kind: "text"; text: string };

export type ListView = {
  id: string;
  title: string;
  badgeCategory: ListCategory | null;
  editorCategory: ListCategory;
  editorIconKey: ListIconKey | null;
  scope: VisibilityScope;
  avatar: ListAvatarView;
};

export type ListItem = {
  id: string;
  label: string;
  quantity: string | null;
  is_done: boolean;
  position: number | null;
};
