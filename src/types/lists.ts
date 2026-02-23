// Type definitions for lists

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

export type List = {
  id: string;
  title: string;
  icon: string | null;
  category: string | null;
};

export type ListItem = {
  id: string;
  label: string;
  quantity: string | null;
  is_done: boolean;
  position: number | null;
};
