// Page for individual list details

import Link from "next/link";
import { supabase } from "@/lib/supabase";

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
    .order("position", { ascending: true });

  if (itemsError) {
    console.error("Error fetching list items:", itemsError);
  }

  const safeItems = items ?? [];

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
        {safeItems.length === 0 ? (
          <div className="text-gray-500">No items in this list. Add some!</div>
        ) : (
          <ul className="space-y-2">
            {safeItems.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={item.is_done}
                  readOnly
                  className="w-4 h-4"
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
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
