import ListItems from "@/app/dashboard/lists/components/ListItems";
import { ListItem } from "@/types/lists";

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
