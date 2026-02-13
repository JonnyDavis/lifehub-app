// Component for rendering the list of items within a list.

import { ListItem } from "@/types/lists";
import ListItemsRow from "@/app/dashboard/lists/components/ListItemsRow";

export default function ListItems({
  items,
  listId,
}: {
  items: ListItem[];
  listId: string;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <ListItemsRow key={item.id} item={item} listId={listId} />
      ))}
    </ul>
  );
}
