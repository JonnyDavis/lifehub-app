import Link from "next/link";

export function DatesHeader() {
  return (
    <header className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h1 className="text-2xl font-bold">Important Dates</h1>
        <p className="text-sm text-gray-600">
          Birthdays, appointments, trips—anything you don&apos;t want to miss.
        </p>
      </div>
      <Link href="/dashboard" className="text-blue-500 hover:underline">
        Back to dashboard
      </Link>
    </header>
  );
}

