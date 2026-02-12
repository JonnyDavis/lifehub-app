"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="rounded bg-gray-100 p-4 text-black">
      <h2 className="text-lg font-semibold mb-2">
        Couldn&rsquo;t load your lists
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Something went wrong while fetching data. Try again.
      </p>

      <div className="flex gap-3 items-center">
        <button
          onClick={() => reset()}
          className="rounded bg-black text-white px-4 py-2 text-sm font-medium"
        >
          Try again
        </button>

        <Link
          href="/dashboard/lists"
          className="text-blue-500 hover:underline text-sm"
        >
          Back to Lists
        </Link>
      </div>
    </div>
  );
}
