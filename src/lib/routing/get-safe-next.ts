export function getSafeNext(value: unknown) {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  return value;
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function originsMatch(url: URL, origin: string) {
  const originUrl = new URL(origin);

  if (url.origin === originUrl.origin) {
    return true;
  }

  // Local auth flows can bounce between equivalent loopback aliases depending on
  // how the dev server is started (`localhost` vs `0.0.0.0`).
  return (
    url.protocol === originUrl.protocol &&
    url.port === originUrl.port &&
    LOCAL_HOSTS.has(url.hostname) &&
    LOCAL_HOSTS.has(originUrl.hostname)
  );
}

export function getSafeNextFromOrigin(value: unknown, origin: string) {
  const asPath = getSafeNext(value);
  if (asPath) return asPath;

  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    if (!originsMatch(url, origin)) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
