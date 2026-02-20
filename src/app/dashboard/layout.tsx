import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

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
            <Link href="/dashboard/dates" className="hover:underline">
              Dates
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
