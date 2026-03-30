// Page for individual list details

import Link from "next/link";
import ListItemsSection from "@/app/dashboard/lists/_components/ListItemsSection";
import { requireListById, getListItems } from "@/lib/queries/lists";
import { AddListItemForm } from "@/app/dashboard/lists/_components/AddListItemForm";
import { presentList, splitListItemsByDone } from "@/lib/presenters/lists";
import { ListCategoryBadge } from "@/components/list-category-badge";
import { ListAvatar } from "@/components/list-avatar";
import { EditListForm } from "@/app/dashboard/lists/_components/EditListForm";
import { VisibilityScopeBadge } from "@/components/visibility-scope-badge";

type ListPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function Page({ params, searchParams }: ListPageProps) {
  const { id } = await params;
  const { created } = await searchParams;

  // Fetch the list details from Supabase
  const list = await requireListById(id);
  const listView = presentList(list);

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
        {created === "1" ? (
          <section className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-900">
            List created. Add a few items to get it ready.
          </section>
        ) : null}
        <section className="flex items-start gap-4">
          <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:items-start sm:gap-4">
            <ListAvatar avatar={listView.avatar} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {listView.title}
                </h2>
                {listView.badgeCategory ? (
                  <ListCategoryBadge category={listView.badgeCategory} />
                ) : null}
                <VisibilityScopeBadge scope={listView.scope} />
              </div>
            </div>
          </div>
        </section>
        <EditListForm list={listView} />
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
