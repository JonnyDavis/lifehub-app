import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

function getSafeNext(value: unknown) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const nextParam = Array.isArray(searchParams?.next)
    ? searchParams?.next[0]
    : searchParams?.next;
  const next = getSafeNext(nextParam);

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
