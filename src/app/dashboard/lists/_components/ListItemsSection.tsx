import { ListItem } from "@/types/lists";
import { Trash2 } from "lucide-react";
import { deleteListItem } from "@/lib/actions/lists";
import { ToggleItemCheckbox } from "@/app/dashboard/lists/ToggleItemCheckbox";

function ListItemsRow({ item, listId }: { item: ListItem; listId: string }) {
  return (
    <li
      key={item.id}
      className="rounded border border-gray-300 bg-white px-3 py-2"
    >
      {/* Left side: toggle form + label */}
      <div className="flex items-start gap-3 justify-between">
        <label className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer select-none rounded active:bg-gray-100">
          <ToggleItemCheckbox
            itemId={item.id}
            listId={listId}
            done={item.is_done}
          />
          <span
            className={`min-w-0 wrap-break-word ${
              item.is_done ? "line-through text-gray-500" : ""
            }`}
          >
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
            className="rounded p-2 text-red-700 hover:bg-red-50"
            aria-label={`Delete ${item.label}`}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </form>
      </div>
    </li>
  );
}

function ListItems({ items, listId }: { items: ListItem[]; listId: string }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <ListItemsRow key={item.id} item={item} listId={listId} />
      ))}
    </ul>
  );
}

type Props = {
  title?: string;
  items: ListItem[];
  listId: string;
  emptyMessage?: string;
  hideIfEmpty?: boolean;
};

export default function ListItemsSection({
  title,
  items,
  listId,
  emptyMessage,
  hideIfEmpty,
}: Props) {
  if (hideIfEmpty && items.length === 0) return null;

  return (
    <section className="mb-6">
      {title && <h3 className="text-md font-semibold mb-2">{title}</h3>}

      {items.length === 0 ? (
        emptyMessage ? (
          <div className="text-gray-500">{emptyMessage}</div>
        ) : null
      ) : (
        <ListItems items={items} listId={listId} />
      )}
    </section>
  );
}
