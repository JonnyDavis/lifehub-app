"use client";

import { useEffect } from "react";

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
    <div>
      <h2>Something went wrong!</h2>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  );

  return (
    <div className="rounded bg-gray-100 p-4 text-black">
      <h2 className="text-lg font-semibold mb-4">Something went wrong</h2>

      <div className="flex gap-3 items-center">
        <button
          onClick={() => reset()}
          className="rounded bg-black text-white px-4 py-2 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
