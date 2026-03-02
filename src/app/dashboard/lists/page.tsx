// Lists page for the dashboard section of the application

import Link from "next/link";
import { getLists } from "@/lib/queries/lists";
import { CreateListForm } from "@/app/dashboard/lists/_components/CreateListForm";
import { ListCategoryBadge } from "@/components/list-category-badge";
import { ListAvatar } from "@/components/list-avatar";
import { presentList } from "@/lib/presenters/lists";

export default async function Page() {
  const lists = await getLists();
  const listViews = lists.map(presentList);

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
          listViews.map((list) => (
            <Link
              key={list.id}
              href={`/dashboard/lists/${list.id}`}
              className="flex gap-4 bg-gray-200 p-4 rounded text-black"
            >
              <ListAvatar avatar={list.avatar} />
              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-lg font-semibold mb-2 truncate">
                    {list.title}
                  </h2>
                  {list.badgeCategory ? (
                    <ListCategoryBadge category={list.badgeCategory} />
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
