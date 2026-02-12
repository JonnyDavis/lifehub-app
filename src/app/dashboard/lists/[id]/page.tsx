// Page for individual list details

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  createListItem,
  toggleListItem,
  deleteListItem,
} from "@/app/dashboard/lists/actions";
import { ToggleItemCheckbox } from "@/app/dashboard/lists/ToggleItemCheckbox";

type ListPageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: ListPageProps) {
  const { id } = await params;

  // Fetch the list details from Supabase
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select("id, title, icon, type")
    .eq("id", id)
    .single();

  if (listError || !list) {
    console.error("Error fetching list:", listError);
    return (
      <div className="text-black">
        <Link
          href="/dashboard/lists"
          className="text-blue-500 hover:underline mb-4 inline-block"
        >
          &larr; Back to Lists
        </Link>
        <div>List not found.</div>
      </div>
    );
  }

  // Fetch the list items from Supabase
  const { data: items, error: itemsError } = await supabase
    .from("list_items")
    .select("id, label, quantity, is_done, position")
    .eq("list_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    console.error("Error fetching list items:", itemsError);
  }

  const safeItems = items ?? [];
  const todoItems = safeItems.filter((item) => !item.is_done);
  const doneItems = safeItems.filter((item) => item.is_done);

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
          <ul className="space-y-2">
            {todoItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 justify-between"
              >
                {/* Left side: toggle form + label */}
                <form
                  action={toggleListItem}
                  className="flex items-center gap-2 flex-1"
                >
                  <ToggleItemCheckbox
                    itemId={item.id}
                    listId={list.id}
                    done={item.is_done}
                  />
                  <span
                    className={item.is_done ? "line-through text-gray-500" : ""}
                  >
                    {item.label}
                    {item.quantity && (
                      <span className="text-xs text-gray-500">
                        {" "}
                        ({item.quantity})
                      </span>
                    )}
                  </span>

                  <button
                    type="submit"
                    className="text-xs text-blue-600 underline"
                  >
                    Toggle
                  </button>
                </form>

                {/* Right side: delete form */}
                <form action={deleteListItem}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="listId" value={list.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-600 underline"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <hr className="my-4 text-gray-300" />

        <h3 className="text-md font-semibold mb-2">Completed items</h3>

        {doneItems.length === 0 ? (
          <div className="text-gray-500">No items in this list. Add some!</div>
        ) : (
          <ul className="space-y-2">
            {doneItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 justify-between"
              >
                {/* Left side: toggle form + label */}
                <form
                  action={toggleListItem}
                  className="flex items-center gap-2 flex-1"
                >
                  <ToggleItemCheckbox
                    itemId={item.id}
                    listId={list.id}
                    done={item.is_done}
                  />
                  <span
                    className={item.is_done ? "line-through text-gray-500" : ""}
                  >
                    {item.label}
                    {item.quantity && (
                      <span className="text-xs text-gray-500">
                        {" "}
                        ({item.quantity})
                      </span>
                    )}
                  </span>

                  <button
                    type="submit"
                    className="text-xs text-blue-600 underline"
                  >
                    Toggle
                  </button>
                </form>

                {/* Right side: delete form */}
                <form action={deleteListItem}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <input type="hidden" name="listId" value={list.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-600 underline"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
