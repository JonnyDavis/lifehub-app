import Link from "next/link";
import { redirect } from "next/navigation";

import { InviteLinkActions } from "@/app/dashboard/household/_components/InviteLinkActions";
import { createClient } from "@/lib/supabase/server";
import { householdsTable, householdMembersTable, profilesTable } from "@/lib/supabase/tables";

type HouseholdPageProps = {
  searchParams: Promise<{ token?: string; switched?: string; ts?: string }>;
};

type HouseholdRow = {
  id: string;
  created_by: string | null;
  created_at: string;
};

function householdLabel({
  household,
  userId,
  memberCount,
}: {
  household: HouseholdRow;
  userId: string;
  memberCount: number;
}) {
  const createdByMe = household.created_by === userId;
  const isSolo = memberCount === 1;
  if (createdByMe && isSolo) return "Personal workspace";
  if (createdByMe) return `Shared workspace (${memberCount} members)`;
  return `Joined workspace (${memberCount} members)`;
}

export default async function Page({ searchParams }: HouseholdPageProps) {
  const { token, switched } = await searchParams;
  const supabase = await createClient();

  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claims?.claims) {
    redirect("/auth/login");
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    redirect("/auth/login");
  }

  const userId = userData.user.id;

  const { data: profile, error: profileError } = await profilesTable(supabase)
    .select("active_household_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error reading profile active household:", profileError);
  }

  const activeHouseholdId = (profile?.active_household_id as string | null) ?? null;

  const { data: myMemberships, error: membershipsError } =
    await householdMembersTable(supabase)
      .select("household_id")
      .eq("user_id", userId);

  if (membershipsError) {
    console.error("Error fetching household memberships:", membershipsError);
    throw membershipsError;
  }

  const householdIds = Array.from(
    new Set((myMemberships ?? []).map((m) => m.household_id as string)),
  );

  const households =
    householdIds.length === 0
      ? []
      : await (async () => {
          const { data: rows, error: householdsError } = await householdsTable(
            supabase,
          )
            .select("id, created_by, created_at")
            .in("id", householdIds)
            .order("created_at", { ascending: true });

          if (householdsError) {
            console.error("Error fetching households:", householdsError);
            throw householdsError;
          }

          return rows ?? [];
        })();

  const allMembers =
    householdIds.length === 0
      ? []
      : await (async () => {
          const { data: rows, error: allMembersError } =
            await householdMembersTable(supabase)
              .select("household_id")
              .in("household_id", householdIds);

          if (allMembersError) {
            console.error("Error fetching household member counts:", allMembersError);
            throw allMembersError;
          }

          return rows ?? [];
        })();

  const memberCountByHouseholdId = new Map<string, number>();
  for (const row of allMembers) {
    const hid = row.household_id as string;
    memberCountByHouseholdId.set(hid, (memberCountByHouseholdId.get(hid) ?? 0) + 1);
  }

  // Keep the server-side value relative; the client resolves it against the active origin.
  const invitePath = token
    ? `/household/join?token=${encodeURIComponent(token)}`
    : null;

  return (
    <article className="grid gap-6">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Workspace</h1>
          <p className="text-sm text-gray-700 mt-1">
            Choose which workspace is active. Lists and dates are scoped to the active workspace.
          </p>
        </div>
        <Link
          href="/dashboard/household/invite"
          className="rounded bg-black text-white px-4 py-2 text-sm font-medium"
        >
          Create invite link
        </Link>
      </header>

      {switched ? (
        <section className="bg-green-50 border border-green-200 p-3 rounded text-green-900 text-sm">
          Workspace switched.
        </section>
      ) : null}

      {invitePath ? (
        <section className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold text-black mb-2">Invite link</h2>
          <p className="text-sm text-gray-700 mb-3">
            Share this link with someone to let them join your active workspace.
          </p>
          <InviteLinkActions invitePath={invitePath} />
        </section>
      ) : null}

      <section className="bg-gray-200 p-4 rounded text-black">
        <h2 className="text-lg font-semibold mb-3">Your workspaces</h2>
        {households.length === 0 ? (
          <p className="text-gray-700">No workspaces found.</p>
        ) : (
          <ul className="grid gap-2">
            {households.map((h) => {
              const hid = h.id as string;
              const memberCount = memberCountByHouseholdId.get(hid) ?? 0;
              const isActive = activeHouseholdId === hid;
              const label = householdLabel({
                household: h as unknown as HouseholdRow,
                userId,
                memberCount,
              });

              return (
                <li
                  key={hid}
                  className="bg-gray-300 p-3 rounded flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{label}</div>
                    <div className="text-xs text-gray-700 truncate mt-1">
                      {hid}
                    </div>
                  </div>
                  {isActive ? (
                    <span className="text-sm text-gray-900 whitespace-nowrap">
                      Active
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/household/switch?householdId=${encodeURIComponent(
                        hid,
                      )}&next=${encodeURIComponent("/dashboard/household")}`}
                      className="text-sm text-blue-700 hover:underline whitespace-nowrap"
                    >
                      Make active
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}
