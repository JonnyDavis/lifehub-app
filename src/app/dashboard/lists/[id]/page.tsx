// Page for individual list details

import Link from "next/link";
import { createListItem } from "@/lib/actions/lists";
import ListItemsSection from "@/app/dashboard/lists/components/ListItemsSection";
import { requireListById, getListItems } from "@/lib/queries/lists";

type ListPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ListPageProps) {
  const { id } = await params;

  // Fetch the list details from Supabase
  const list = await requireListById(id);

  // Fetch the list items from Supabase
  const items = await getListItems(id);

  const todoItems = items.filter((item) => !item.is_done);
  const doneItems = items.filter((item) => item.is_done);

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
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            {list.icon ?? list.title[0]}
          </div>
          <h2 className="text-lg font-semibold mb-2">{list.title}</h2>
        </section>
        <hr className="my-4" />

        <section>
          <h3 className="text-md font-semibold mb-2">Add item</h3>
          <form
            action={createListItem}
            className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-end"
          >
            <input type="hidden" name="listId" value={list.id} />

            <div className="flex-1">
              <label htmlFor="label" className="sr-only">
                Item name
              </label>
              <input
                id={`label-${list.id}`}
                name="label"
                type="text"
                required
                placeholder="Item name"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="sr-only">
                Quantity
              </label>
              <input
                id={`quantity-${list.id}`}
                name="quantity"
                type="text"
                placeholder="Quantity (optional)"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
              />
            </div>

            <button
              type="submit"
              className="rounded bg-black text-white px-4 py-2 text-sm font-medium"
            >
              Add
            </button>
          </form>
        </section>

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
