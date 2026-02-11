// Home page for the dashboard section of the application

import Link from "next/link";

export default function Page() {
  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-200 p-4 rounded text-black">Summary 1</div>
        <div className="bg-gray-200 p-4 rounded text-black">Summary 2</div>
        <div className="bg-gray-200 p-4 rounded text-black">Summary 3</div>
        <div className="bg-gray-200 p-4 rounded text-black">Summary 4</div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-gray-200 p-4 rounded text-black">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold mb-2">Lists</h3>
            <Link
              href="/dashboard/lists"
              className="text-blue-500 hover:underline"
            >
              View All Lists
            </Link>
          </div>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-300 p-3 rounded">Grocery List</div>
            <div className="bg-gray-300 p-3 rounded">Work Tasks</div>
            <div className="bg-gray-300 p-3 rounded">Personal Goals</div>
            <div className="bg-gray-300 p-3 rounded">Travel Plans</div>
          </div>
        </div>
        <div className="bg-gray-200 p-4 rounded text-black">
          <h3 className="text-lg font-semibold mb-2">Upcoming Dates</h3>
          <div>
            <div className="bg-gray-300 p-3 rounded mb-2">
              Meeting with Team - Aug 20, 2024
            </div>
            <div className="bg-gray-300 p-3 rounded mb-2">
              Doctor&lsquo;s Appointment - Aug 22, 2024
            </div>
            <div className="bg-gray-300 p-3 rounded mb-2">
              Friend&lsquo;s Birthday - Aug 25, 2024
            </div>
            <div className="bg-gray-300 p-3 rounded mb-2">
              Vacation Starts - Aug 30, 2024
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
