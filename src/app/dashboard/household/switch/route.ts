import { NextResponse } from "next/server";

import { getSafeNextFromOrigin } from "@/lib/routing/get-safe-next";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const householdId = url.searchParams.get("householdId");

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return NextResponse.redirect(new URL("/auth/login", url));
  }

  if (!householdId || householdId.trim().length === 0) {
    return NextResponse.redirect(new URL("/auth/error?error=missing_household_id", url));
  }

  const { error: setError } = await supabase.rpc("set_active_household", {
    p_household_id: householdId,
  });

  if (setError) {
    console.error("Error setting active household:", setError);
    return NextResponse.redirect(new URL(`/auth/error?error=${setError.code ?? "switch_error"}`, url));
  }

  const requestedNext = url.searchParams.get("next");
  const safeNext = getSafeNextFromOrigin(requestedNext, url.origin);
  const safeDashboardNext =
    safeNext && safeNext.startsWith("/dashboard") ? safeNext : null;

  const destination = new URL(
    safeDashboardNext ?? "/dashboard/household",
    url,
  );
  destination.searchParams.set("switched", "1");
  destination.searchParams.set("ts", Date.now().toString());
  return NextResponse.redirect(destination);
}
