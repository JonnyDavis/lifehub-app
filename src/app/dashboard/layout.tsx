import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { profilesTable } from "@/lib/supabase/tables";

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

  // We redirect new users through `/dashboard/bootstrap` to avoid doing DB writes
  // during the Server Component render, which can race with the dashboard page's
  // initial reads (and cause defaults to appear only after a refresh).
  //
  // This layout only *checks* whether bootstrapping is done; the bootstrap route
  // is responsible for running the inserts and then redirecting back.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/auth/login");
  }

  // `profiles.user_id` is the primary key, so we can look up per-user bootstrap
  // state cheaply. If there is no row yet, treat it as "not bootstrapped".
  const { data: profile, error: profileError } = await profilesTable(supabase)
    .select("bootstrap_state")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Error reading profile bootstrap state:", profileError);
  }

  // Anything other than `done` (including `null`) means we should run bootstrap.
  if (profile?.bootstrap_state !== "done") {
    redirect("/dashboard/bootstrap");
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
