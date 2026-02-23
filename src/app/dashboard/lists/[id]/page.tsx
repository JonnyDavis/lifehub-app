// Page for individual list details

import Link from "next/link";
import ListItemsSection from "@/app/dashboard/lists/_components/ListItemsSection";
import { requireListById, getListItems } from "@/lib/queries/lists";
import { AddListItemForm } from "@/app/dashboard/lists/_components/AddListItemForm";
import {
  normalizeListCategory,
  splitListItemsByDone,
} from "@/lib/presenters/lists";
import { ListCategoryBadge } from "@/components/list-category-badge";
import { ListAvatar } from "@/components/list-avatar";

type ListPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ListPageProps) {
  const { id } = await params;

  // Fetch the list details from Supabase
  const list = await requireListById(id);

  // Fetch the list items from Supabase
  const items = await getListItems(id);

  const { todoItems, doneItems } = splitListItemsByDone(items);

  return (
    <>
      <Link
        href="/dashboard/lists"
        className="text-blue-500 hover:underline mb-4 inline-block"
      >
        &larr; Back to Lists
      </Link>
      <article className="bg-gray-200 p-4 rounded text-black">
        <section className="flex gap-4">
          <ListAvatar list={list} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-lg font-semibold mb-2 truncate">
                {list.title}
              </h2>
              {(() => {
                const category = normalizeListCategory(list.category);
                return category ? <ListCategoryBadge category={category} /> : null;
              })()}
            </div>
          </div>
        </section>
        <hr className="my-4" />

        <AddListItemForm listId={list.id} />

        <ListItemsSection
          title="To do"
          items={todoItems}
          listId={list.id}
          emptyMessage="No items in this list. Add some!"
        />

        <ListItemsSection
          title="Completed items"
          items={doneItems}
          listId={list.id}
          hideIfEmpty
        />
      </article>
    </>
  );
}
