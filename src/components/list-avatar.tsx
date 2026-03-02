import type { ListAvatarView } from "@/types/lists";
import { ListIcon } from "@/components/list-icon";

export function ListAvatar({
  avatar,
}: {
  avatar: ListAvatarView;
}) {
  return (
    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
      {avatar.kind === "icon" ? (
        <ListIcon icon={avatar.icon} className="w-4 h-4 text-gray-900" />
      ) : (
        <span aria-hidden>{avatar.text}</span>
      )}
    </div>
  );
}
