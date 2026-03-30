import { createListItem } from "@/lib/actions/lists";

export function AddListItemForm({ listId }: { listId: string }) {
  return (
    <section>
      <h3 className="text-md font-semibold mb-2">Add item</h3>
      <form
        action={createListItem}
        className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <input type="hidden" name="listId" value={listId} />

        <div className="w-full flex-1">
          <label htmlFor="label" className="sr-only">
            Item name
          </label>
          <input
            id={`label-${listId}`}
            name="label"
            type="text"
            required
            placeholder="Item name"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </div>

        <div className="w-full sm:w-auto">
          <label htmlFor="quantity" className="sr-only">
            Quantity
          </label>
          <input
            id={`quantity-${listId}`}
            name="quantity"
            type="text"
            placeholder="Quantity (optional)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black sm:min-w-40"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-black text-white px-4 py-2 text-sm font-medium sm:w-auto"
        >
          Add
        </button>
      </form>
    </section>
  );
}
