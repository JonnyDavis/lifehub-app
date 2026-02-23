import { createList } from "@/lib/actions/lists";

export function CreateListForm() {
  return (
    <section className="bg-gray-100 p-4 rounded mb-6">
      <h2 className="text-lg text-black font-semibold mb-3">Create New List</h2>
      <form
        action={createList}
        className="flex flex-col sm:flex-row gap-3 items-start sm:items-end"
      >
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
          <label htmlFor="type" className="sr-only">
            List type
          </label>
          <select
            id="type"
            name="type"
            className="rounded border border-gray-300 px-3 py-2 text-sm text-black"
            defaultValue=""
          >
            <option value="" disabled>
              Select type (optional)
            </option>
            <option value="shopping">Shopping</option>
            <option value="tasks">Tasks</option>
            <option value="packing">Packing</option>
            <option value="goals">Goals</option>
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
