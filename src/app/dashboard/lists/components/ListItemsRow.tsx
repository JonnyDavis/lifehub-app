// Component for rendering a single item within a list, along with toggle and delete actions.

import { ListItem } from "@/types/lists";
import { deleteListItem } from "@/app/dashboard/lists/actions";
import { ToggleItemCheckbox } from "@/app/dashboard/lists/ToggleItemCheckbox";

type Props = {
  item: ListItem;
  listId: string;
};

export default function ListItemsRow({ item, listId }: Props) {
  return (
    <li key={item.id} className="flex items-center gap-2 justify-between">
      {/* Left side: toggle form + label */}
      <label className="flex items-center gap-3 flex-1 cursor-pointer select-none rounded px-2 py-2 active:bg-gray-300">
        <ToggleItemCheckbox
          itemId={item.id}
          listId={listId}
          done={item.is_done}
        />
        <span className={item.is_done ? "line-through text-gray-500" : ""}>
          {item.label}
          {item.quantity && (
            <span className="text-xs text-gray-500"> ({item.quantity})</span>
          )}
        </span>
      </label>

      {/* Right side: delete form */}
      <form action={deleteListItem} className="shrink-0">
        <input type="hidden" name="itemId" value={item.id} />
        <input type="hidden" name="listId" value={listId} />
        <button
          type="submit"
          className="text-xs text-red-600 underline px-2 py-2"
        >
          Delete
        </button>
      </form>
    </li>
  );
}
