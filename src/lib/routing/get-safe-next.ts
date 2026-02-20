export function getSafeNext(value: unknown) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

export function getSafeNextFromOrigin(value: unknown, origin: string) {
  const asPath = getSafeNext(value);
  if (asPath) return asPath;

  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    if (url.origin !== origin) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
