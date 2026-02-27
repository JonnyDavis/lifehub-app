import { updateListIcon } from "@/lib/actions/lists";
import { ListIcon } from "@/components/list-icon";
import { LIST_ICON_KEYS } from "@/types/lists";
import { normalizeListIconKey } from "@/lib/presenters/lists";

export function EditListIcon({
  listId,
  icon,
}: {
  listId: string;
  icon: string | null;
}) {
  const selectedIcon = normalizeListIconKey(icon);

  return (
    <section className="mt-3">
      <h3 className="text-sm font-medium text-gray-700 mb-2">Icon</h3>
      <div className="flex flex-wrap gap-2 items-center">
        {LIST_ICON_KEYS.map((k) => {
          const isSelected = selectedIcon === k;
          return (
            <form key={k} action={updateListIcon}>
              <input type="hidden" name="listId" value={listId} />
              <input type="hidden" name="icon" value={k} />
              <button
                type="submit"
                className={`rounded border px-2 py-2 bg-white hover:bg-gray-50 ${
                  isSelected
                    ? "border-black ring-1 ring-black"
                    : "border-gray-300"
                }`}
                aria-label={`Set icon to ${k}`}
                title={k}
              >
                <ListIcon icon={k} className="w-4 h-4 text-gray-900" />
              </button>
            </form>
          );
        })}

        <form action={updateListIcon}>
          <input type="hidden" name="listId" value={listId} />
          <input type="hidden" name="icon" value="" />
          <button
            type="submit"
            className="rounded border border-gray-300 px-3 py-2 text-sm bg-white hover:bg-gray-50"
          >
            Reset
          </button>
        </form>
      </div>
    </section>
  );
}

