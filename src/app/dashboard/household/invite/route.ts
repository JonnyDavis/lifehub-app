import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  // In local dev the app may be bound to 0.0.0.0, so prefer the incoming host header
  // when building redirects back into the app.
  const requestProtocol =
    request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const requestHost =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    url.host;
  const requestOrigin = `${requestProtocol}://${requestHost}`;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return NextResponse.redirect(new URL("/auth/login", requestOrigin));
  }

  const { data: householdId, error: householdError } = await supabase.rpc(
    "current_household_id",
  );

  if (householdError || !householdId) {
    console.error("Error reading current household id:", householdError);
    return NextResponse.redirect(
      new URL("/auth/error?error=missing_household", requestOrigin),
    );
  }

  const { data: token, error: inviteError } = await supabase.rpc(
    "create_household_invite",
    {
      p_household_id: householdId,
    },
  );

  if (inviteError || !token) {
    console.error("Error creating household invite:", inviteError);
    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${inviteError?.code ?? "invite_error"}`,
        requestOrigin,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(
      `/dashboard/household?token=${encodeURIComponent(token)}`,
      requestOrigin,
    ),
  );
}
