import type { VisibilityScope } from "@/types/visibility";

function visibilityScopeBadgeClass(scope: VisibilityScope) {
  if (scope === "household") return "bg-emerald-200 text-emerald-900";
  return "bg-gray-200 text-gray-900";
}

function visibilityScopeLabel(scope: VisibilityScope) {
  return scope === "household" ? "Household" : "Personal";
}

export function VisibilityScopeBadge({ scope }: { scope: VisibilityScope }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${visibilityScopeBadgeClass(
        scope,
      )}`}
      title={visibilityScopeLabel(scope)}
    >
      {visibilityScopeLabel(scope)}
    </span>
  );
}

