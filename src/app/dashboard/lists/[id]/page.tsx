// Page for individual list details

import Link from "next/link";
import { createListItem } from "@/app/dashboard/lists/actions";
import ListItems from "@/app/dashboard/lists/components/ListItems";
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
      <div className="bg-gray-200 p-4 rounded text-black">
        <div className="flex gap-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            {list.icon ?? list.title[0]}
          </div>
          <h2 className="text-lg font-semibold mb-2">{list.title}</h2>
        </div>
        <hr className="my-4" />

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
              id="label"
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
              id="quantity"
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

        {todoItems.length === 0 ? (
          <div className="text-gray-500">No items in this list. Add some!</div>
        ) : (
          <ListItems items={todoItems} listId={list.id} />
        )}

        {doneItems.length > 0 && (
          <>
            <hr className="my-4 text-gray-300" />
            <h3 className="text-md font-semibold mb-2">Completed items</h3>
            <ListItems items={doneItems} listId={list.id} />
          </>
        )}
      </div>
    </>
  );
}
