import Link from "next/link";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <hgroup>
            <h1>LifeHub</h1>
            <h2>Welcome to your dashboard</h2>
          </hgroup>
          <nav className="flex gap-4 text-sm">
            <Link href="/dashboard" className="hover:underline">
              Overview
            </Link>
            <Link href="/dashboard/lists" className="hover:underline">
              Lists
            </Link>
            {/* Dates later */}
          </nav>
          <div className="flex gap-2">
            <button>Add List</button>
            <button>Add Date</button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
