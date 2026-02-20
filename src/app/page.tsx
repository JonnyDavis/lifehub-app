import { redirect } from "next/navigation";

import { getNextFromSearchParams } from "@/lib/routing/get-next-from-search-params";
import { createClient } from "@/lib/supabase/server";

export default async function Page({
  searchParams,
}: {
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = await getNextFromSearchParams(searchParams);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims) {
    redirect(next ?? "/dashboard");
  }

  if (next) {
    redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }

  redirect("/auth/login");
}
