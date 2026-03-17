import { createList } from "@/lib/actions/lists";
import { listCategoryLabel } from "@/lib/presenters/lists";
import { LIST_CATEGORIES } from "@/types/lists";
import {
  VISIBILITY_SCOPES,
  normalizeVisibilityScope,
  type VisibilityFilter,
} from "@/types/visibility";
import { createClient } from "@/lib/supabase/server";

export async function CreateListForm({
  defaultScope,
}: {
  defaultScope: VisibilityFilter;
}) {
  const scopeFromFilter =
    defaultScope === "personal" || defaultScope === "household"
      ? defaultScope
      : null;

  const scopeFromDb = scopeFromFilter
    ? null
    : await (async () => {
        const supabase = await createClient();
        const { data, error } = await supabase.rpc(
          "default_scope_for_current_user",
        );
        if (error) return null;
        return normalizeVisibilityScope(data);
      })();

  const initialScope = scopeFromFilter ?? scopeFromDb ?? "personal";

  return (
    <section className="bg-gray-100 p-4 rounded mb-6">
      <h2 className="text-lg text-black font-semibold mb-3">Create New List</h2>
      <form
        action={createList}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-end"
      >
        <input type="hidden" name="scopeFilter" value={defaultScope} />
        <div className="flex-1">
          <label htmlFor="title" className="sr-only">
            List name
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="List name"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </div>

        <div>
          <label htmlFor="category" className="sr-only">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="rounded border border-gray-300 px-3 py-2 text-sm text-black"
            defaultValue="other"
          >
            {LIST_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {listCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="scope" className="sr-only">
            Visibility
          </label>
          <select
            id="scope"
            name="scope"
            className="rounded border border-gray-300 px-3 py-2 text-sm text-black"
            defaultValue={initialScope}
          >
            {VISIBILITY_SCOPES.map((s) => (
              <option key={s} value={s}>
                {s === "personal" ? "Personal" : "Household"}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="rounded bg-black text-white px-4 py-2 text-sm font-medium"
        >
          Create list
        </button>
      </form>
    </section>
  );
}
