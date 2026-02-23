import { ListItem } from "@/types/lists";
import { deleteListItem } from "@/lib/actions/lists";
import { ToggleItemCheckbox } from "@/app/dashboard/lists/ToggleItemCheckbox";

function ListItemsRow({ item, listId }: { item: ListItem; listId: string }) {
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
          aria-label={`Delete ${item.label}`}
        >
          Delete
        </button>
      </form>
    </li>
  );
}

function ListItems({ items, listId }: { items: ListItem[]; listId: string }) {
  return (
    <ul className="space-y-2">
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
    <section>
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
