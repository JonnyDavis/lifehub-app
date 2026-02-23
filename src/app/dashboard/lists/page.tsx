// Lists page for the dashboard section of the application

import Link from "next/link";
import { getLists } from "@/lib/queries/lists";
import { listAvatarText } from "@/lib/presenters/lists";
import { CreateListForm } from "@/app/dashboard/lists/_components/CreateListForm";
import { ListCategoryBadge } from "@/components/list-category-badge";
import { LIST_CATEGORIES, type ListCategory } from "@/types/lists";

export default async function Page() {
  const lists = await getLists();

  return (
    <article>
      <h1 className="text-2xl font-bold mb-4">Your Lists</h1>

      <CreateListForm />

      <section className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!lists || lists.length === 0 ? (
          <div className="text-gray-500">
            No lists found. Start by creating a new list above.
          </div>
        ) : (
          lists.map((list) => (
            <Link
              key={list.id}
              href={`/dashboard/lists/${list.id}`}
              className="flex gap-4 bg-gray-200 p-4 rounded text-black"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                {listAvatarText(list)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg font-semibold mb-2 truncate">
                    {list.title}
                  </h2>
                  {typeof list.category === "string" &&
                  LIST_CATEGORIES.includes(list.category as ListCategory) ? (
                    <ListCategoryBadge
                      category={list.category as ListCategory}
                    />
                  ) : null}
                </div>
              </div>
            </Link>
          ))
        )}
      </section>
    </article>
  );
}
