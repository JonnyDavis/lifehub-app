export const VISIBILITY_SCOPES = ["personal", "household"] as const;
export type VisibilityScope = (typeof VISIBILITY_SCOPES)[number];

export const VISIBILITY_FILTERS = ["all", ...VISIBILITY_SCOPES] as const;
export type VisibilityFilter = (typeof VISIBILITY_FILTERS)[number];

// Parse/normalize a raw value into a *row visibility* scope.
//
// Used for writes (e.g. server actions): if the value isn't one of the allowed
// scope strings, return null so callers can fall back to DB defaults or reject.
export function normalizeVisibilityScope(value: unknown): VisibilityScope | null {
  if (value === "personal") return "personal";
  if (value === "household") return "household";
  return null;
}

// Parse/normalize a raw value into a *UI filter*.
//
// Used for query strings and navigation state: unknown values fall back to "all"
// so the UI remains robust and doesn't hide content unexpectedly.
export function normalizeVisibilityFilter(value: unknown): VisibilityFilter {
  if (value === "personal") return "personal";
  if (value === "household") return "household";
  return "all";
}

// Human-friendly labels for filters (nav).
export function visibilityFilterLabel(filter: VisibilityFilter) {
  if (filter === "household") return "Household";
  if (filter === "personal") return "Personal";
  return "All";
}
