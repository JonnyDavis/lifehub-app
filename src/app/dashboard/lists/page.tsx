// Lists page for the dashboard section of the application

import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function Page() {
  const { data: lists, error } = await supabase
    .from("lists")
    .select("id, title, icon, type")
    .order("created_at", { ascending: true });

  if (error) {
    console.error(error);
    return <div>Error loading lists</div>;
  }

  if (!lists || lists.length === 0) {
    return <div>No lists found. Start by creating a new list!</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your Lists</h1>
      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lists.map((list) => (
          <Link
            key={list.id}
            href={`/dashboard/lists/${list.id}`}
            className="flex gap-4 bg-gray-200 p-4 rounded text-black"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {list.icon ?? list.title[0]}
            </div>
            <h2 className="text-lg font-semibold mb-2">{list.title}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}
