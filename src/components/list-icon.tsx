import {
  Backpack,
  FolderKanban,
  Heart,
  ListChecks,
  MapPin,
  ShoppingCart,
  Tag,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";

import type { ListIconKey } from "@/types/lists";

const ICONS: Record<ListIconKey, ComponentType<{ className?: string }>> = {
  "shopping-cart": ShoppingCart,
  "list-checks": ListChecks,
  "map-pin": MapPin,
  backpack: Backpack,
  wrench: Wrench,
  "folder-kanban": FolderKanban,
  heart: Heart,
  tag: Tag,
};

export function ListIcon({
  icon,
  className,
}: {
  icon: ListIconKey;
  className?: string;
}) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden />;
}
