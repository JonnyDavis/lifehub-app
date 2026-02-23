export function formatImportantDateLabel(dateISO: string) {
  const asDate = new Date(`${dateISO}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(asDate);
}

export function relativeImportantDateDistanceLabel(dateISO: string) {
  const [year, month, day] = dateISO.split("-").map(Number);
  if (!year || !month || !day) return "";

  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const targetUtc = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((targetUtc - todayUtc) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "Today";

  const absDays = Math.abs(diffDays);
  const prefix = diffDays > 0 ? "in " : "";
  const suffix = diffDays < 0 ? " ago" : "";

  if (absDays < 14) {
    return `${prefix}${absDays} day${absDays === 1 ? "" : "s"}${suffix}`;
  }

  if (absDays < 60) {
    const weeks = Math.round(absDays / 7);
    return `${prefix}${weeks} week${weeks === 1 ? "" : "s"}${suffix}`;
  }

  const months = Math.round(absDays / 30);
  if (months < 18) {
    return `${prefix}${months} month${months === 1 ? "" : "s"}${suffix}`;
  }

  const years = Math.round(months / 12);
  return `${prefix}${years} year${years === 1 ? "" : "s"}${suffix}`;
}
