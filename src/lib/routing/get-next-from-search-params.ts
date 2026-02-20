import { getSafeNext } from "@/lib/routing/get-safe-next";

export type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>
  | undefined;

export async function getNextFromSearchParams(searchParams: SearchParamsInput) {
  const resolvedSearchParams = await searchParams;
  const nextParam = Array.isArray(resolvedSearchParams?.next)
    ? resolvedSearchParams?.next[0]
    : resolvedSearchParams?.next;
  return getSafeNext(nextParam);
}

