export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <hgroup>
            <h1>LifeHub</h1>
            <h2>Welcome to your dashboard</h2>
          </hgroup>
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
