// Type definitions for lists

export type List = {
  id: string;
  title: string;
  icon: string | null;
  type: string | null;
};

export type ListItem = {
  id: string;
  label: string;
  quantity: string | null;
  is_done: boolean;
  position: number | null;
};
