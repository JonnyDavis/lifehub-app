import { createImportantDate } from "@/lib/actions/important-dates";
import { importantDateCategoryLabel } from "@/lib/presenters/important-dates";
import { IMPORTANT_DATE_CATEGORIES } from "@/types/important-dates";

export function AddImportantDateForm() {
  return (
    <section className="bg-gray-100 p-4 rounded mb-6">
      <h2 className="text-lg text-black font-semibold mb-3">Add a date</h2>
      <form action={createImportantDate} className="grid gap-3">
        <div>
          <label htmlFor="title" className="sr-only">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Title (e.g., Dentist appointment)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
          />
        </div>

        <div>
          <label htmlFor="date" className="sr-only">
            Date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
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
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
            defaultValue="event"
          >
            {IMPORTANT_DATE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {importantDateCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="sr-only">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            placeholder="Notes (optional)"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-black"
            rows={3}
          />
        </div>

        <div>
          <button
            type="submit"
            className="rounded bg-black text-white px-4 py-2 text-sm font-medium"
          >
            Add date
          </button>
        </div>
      </form>
    </section>
  );
}

