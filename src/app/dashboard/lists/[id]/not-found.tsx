import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded bg-gray-100 p-4 text-black">
      <h1 className="text-xl font-bold mb-2">List not found</h1>
      <p className="text-sm text-gray-600 mb-4">
        It may have been deleted or the link is incorrect.
      </p>

      <Link
        href="/dashboard/lists"
        className="text-blue-500 hover:underline text-sm"
      >
        Back to Lists
      </Link>
    </div>
  );
}
