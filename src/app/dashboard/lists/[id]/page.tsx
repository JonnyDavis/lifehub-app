// Page for individual list details

import { lists } from "../data";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const list = lists.find((l) => l.id === id);

  if (!list) {
    return <div>List not found</div>;
  }

  return (
    <>
      <Link
        href="/dashboard/lists"
        className="text-blue-500 hover:underline mb-4 inline-block"
      >
        &larr; Back to Lists
      </Link>
      <div className="bg-gray-200 p-4 rounded text-black">
        <div className="flex gap-4">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            {list.icon}
          </div>
          <h2 className="text-lg font-semibold mb-2">{list.title}</h2>
        </div>
        <hr className="my-4"></hr>
        <ul className="list-disc list-inside">
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
          <li>Item 4</li>
        </ul>
      </div>
    </>
  );
}
