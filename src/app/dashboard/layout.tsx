import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { profilesTable } from "@/lib/supabase/tables";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Dashboard content is user-specific and (Phase 3+) depends on the DB-selected active household.
  // Avoid serving cached Server Component payloads across household switches.
  noStore();

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  // We redirect new users through `/dashboard/bootstrap` to finish lightweight
  // account provisioning outside the Server Component render.
  //
  // This layout only *checks* whether provisioning is done; the bootstrap route
  // is responsible for ensuring the personal workspace/profile state and then
  // redirecting back.
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

  // New users are expected to pass through `/dashboard/bootstrap` before the
  // dashboard renders normally. If provisioning never reaches `done`, this layout
  // will keep redirecting there.
  // Anything other than `done` (including `null`) means we should run bootstrap.
  if (profile?.bootstrap_state !== "done") {
    redirect("/dashboard/bootstrap");
  }

  return (
    <>
      <header className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start justify-between gap-4 lg:flex-1 lg:items-center">
            <hgroup>
              <h1>LifeHub</h1>
              <h2>Welcome to your dashboard</h2>
            </hgroup>
            <div className="lg:hidden">
              <LogoutButton />
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm lg:justify-center">
            <Link
              href="/dashboard"
              className="rounded bg-gray-700 px-3 py-2 hover:bg-gray-600"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/lists"
              className="rounded bg-gray-700 px-3 py-2 hover:bg-gray-600"
            >
              Lists
            </Link>
            <Link
              href="/dashboard/dates"
              className="rounded bg-gray-700 px-3 py-2 hover:bg-gray-600"
            >
              Dates
            </Link>
            <Link
              href="/dashboard/household"
              className="rounded bg-gray-700 px-3 py-2 hover:bg-gray-600"
            >
              Workspace
            </Link>
          </nav>
          <div className="hidden items-center gap-4 lg:flex">
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
