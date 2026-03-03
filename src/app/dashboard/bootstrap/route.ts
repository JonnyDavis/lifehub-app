import { NextResponse } from "next/server";

import { ensureUserBootstrappedDefaults } from "@/lib/actions/bootstrap-defaults";
import { getSafeNextFromOrigin } from "@/lib/routing/get-safe-next";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();

  // Keep this route protected. It relies on an authenticated Supabase session so
  // inserts are owned by `auth.uid()` and pass strict RLS policies.
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return NextResponse.redirect(new URL("/auth/login", url));
  }

  // Run the idempotent bootstrap, then bounce back to `/dashboard` (or a safe
  // dashboard sub-route via `?next=`).
  await ensureUserBootstrappedDefaults(supabase);

  const requestedNext = url.searchParams.get("next");
  const safeNext = getSafeNextFromOrigin(requestedNext, url.origin);
  const safeDashboardNext =
    safeNext && safeNext.startsWith("/dashboard") ? safeNext : null;

  return NextResponse.redirect(new URL(safeDashboardNext ?? "/dashboard", url));
}
