import { NextResponse } from "next/server";

import { getSafeNextFromOrigin } from "@/lib/routing/get-safe-next";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    const nextPath = `/household/join?token=${encodeURIComponent(token ?? "")}`;
    return NextResponse.redirect(
      new URL(`/auth/login?next=${encodeURIComponent(nextPath)}`, url),
    );
  }

  if (!token || token.trim().length === 0) {
    return NextResponse.redirect(new URL("/auth/error?error=missing_token", url));
  }

  const { error: acceptError } = await supabase.rpc("accept_household_invite", {
    p_token: token,
  });

  if (acceptError) {
    console.error("Error accepting household invite:", acceptError);
    return NextResponse.redirect(new URL(`/auth/error?error=${acceptError.code ?? "invite_error"}`, url));
  }

  const requestedNext = url.searchParams.get("next");
  const safeNext = getSafeNextFromOrigin(requestedNext, url.origin);
  const safeDashboardNext =
    safeNext && safeNext.startsWith("/dashboard") ? safeNext : null;

  return NextResponse.redirect(new URL(safeDashboardNext ?? "/dashboard", url));
}

