import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return NextResponse.redirect(new URL("/auth/login", url));
  }

  const { data: householdId, error: householdError } = await supabase.rpc(
    "current_household_id",
  );

  if (householdError || !householdId) {
    console.error("Error reading current household id:", householdError);
    return NextResponse.redirect(new URL("/auth/error?error=missing_household", url));
  }

  const { data: token, error: inviteError } = await supabase.rpc(
    "create_household_invite",
    {
      p_household_id: householdId,
    },
  );

  if (inviteError || !token) {
    console.error("Error creating household invite:", inviteError);
    return NextResponse.redirect(new URL(`/auth/error?error=${inviteError?.code ?? "invite_error"}`, url));
  }

  return NextResponse.redirect(
    new URL(`/dashboard/household?token=${encodeURIComponent(token)}`, url),
  );
}

