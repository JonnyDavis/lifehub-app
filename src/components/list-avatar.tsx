import type { List } from "@/types/lists";

import {
  defaultListIconKey,
  listAvatarText,
  normalizeListCategory,
  normalizeListIconKey,
} from "@/lib/presenters/lists";
import { ListIcon } from "@/components/list-icon";

function isReasonableIconText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 4;
}

export function ListAvatar({
  list,
}: {
  list: Pick<List, "icon" | "title" | "category">;
}) {
  const iconKey = normalizeListIconKey(list.icon);
  const category = normalizeListCategory(list.category);
  const defaultIconKey = category ? defaultListIconKey(category) : null;

  const customIconText =
    typeof list.icon === "string" && !iconKey && isReasonableIconText(list.icon)
      ? list.icon.trim()
      : null;

  return (
    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
      {iconKey ? (
        <ListIcon icon={iconKey} className="w-4 h-4 text-gray-900" />
      ) : customIconText ? (
        <span aria-hidden>{customIconText}</span>
      ) : defaultIconKey ? (
        <ListIcon icon={defaultIconKey} className="w-4 h-4 text-gray-900" />
      ) : (
        <span aria-hidden>{listAvatarText(list)}</span>
      )}
    </div>
  );
}
