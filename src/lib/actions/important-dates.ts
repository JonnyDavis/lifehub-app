"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { normalizeImportantDateCategory } from "@/lib/presenters/important-dates";
import {
  normalizeImportantDatesView,
  type ImportantDatesView,
} from "@/types/important-dates";
import { normalizeVisibilityFilter, normalizeVisibilityScope } from "@/types/visibility";
import type { VisibilityFilter, VisibilityScope } from "@/types/visibility";
import { importantDatesTable } from "@/lib/supabase/tables";

function getRequiredTrimmedString(
  formData: FormData,
  key: string,
): string | null {
  const value = formData.get(key);
  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value.trim();
}

function getRequiredString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (!value || typeof value !== "string") return null;
  return value;
}

function getOptionalTrimmedString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function todayISODateLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function currentMonthISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

// After save, choose a tab where the edited/created date will still be visible.
function getImportantDatesTargetView(
  date: string,
  currentView: ImportantDatesView,
) {
  const today = todayISODateLocal();
  const isUpcoming = date >= today;
  const isPast = date < today;

  const viewStillMatches =
    currentView === "all"
      ? true
      : currentView === "upcoming"
        ? isUpcoming
        : currentView === "past"
          ? isPast
          : date.slice(0, 7) === currentMonthISO();

  if (viewStillMatches) {
    return currentView;
  }

  if (currentView === "month") {
    if (date.slice(0, 7) === currentMonthISO()) return "month";
    return isUpcoming ? "upcoming" : "past";
  }

  return isUpcoming ? "upcoming" : "past";
}

// If the user changes Personal/Household during save, switch the filter too.
function getImportantDatesTargetScope(
  selectedScope: VisibilityFilter,
  createdScope: VisibilityScope,
) {
  if (selectedScope === "all" || selectedScope === createdScope) {
    return selectedScope;
  }

  return createdScope;
}

function importantDatesCreatePath({
  view,
  scope,
  error,
  createdId,
}: {
  view: ImportantDatesView;
  scope: VisibilityFilter;
  error?: "missing_title" | "missing_date" | "create_failed";
  createdId?: string;
}) {
  const params = new URLSearchParams({ view });
  if (scope !== "all") {
    params.set("scope", scope);
  }
  if (error) {
    params.set("error", error);
  }
  if (createdId) {
    params.set("created", "1");
  }

  const path = `/dashboard/dates?${params.toString()}`;
  return createdId ? `${path}#date-${createdId}` : path;
}

export async function createImportantDate(formData: FormData) {
  const supabase = await createClient();

  const cleanTitle = getRequiredTrimmedString(formData, "title");
  const cleanDate = getRequiredTrimmedString(formData, "date");
  const cleanNotes = getOptionalTrimmedString(formData, "notes");
  const category = formData.get("category");
  const scope = formData.get("scope");
  const view = formData.get("view");
  const scopeFilter = formData.get("scopeFilter");
  const cleanView = normalizeImportantDatesView(view);
  const cleanScopeFilter = normalizeVisibilityFilter(scopeFilter);

  if (!cleanTitle) {
    redirect(
      importantDatesCreatePath({
        view: cleanView,
        scope: cleanScopeFilter,
        error: "missing_title",
      }),
    );
  }

  if (!cleanDate) {
    redirect(
      importantDatesCreatePath({
        view: cleanView,
        scope: cleanScopeFilter,
        error: "missing_date",
      }),
    );
  }

  const cleanCategory = normalizeImportantDateCategory(category);
  const cleanScope = normalizeVisibilityScope(scope) ?? "personal";

  const { data, error } = await importantDatesTable(supabase)
    .insert({
      title: cleanTitle,
      date: cleanDate,
      notes: cleanNotes,
      category: cleanCategory,
      scope: cleanScope,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating important date:", error);
    redirect(
      importantDatesCreatePath({
        view: cleanView,
        scope: cleanScopeFilter,
        error: "create_failed",
      }),
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/dates");

  const targetView = getImportantDatesTargetView(cleanDate, cleanView);
  const targetScope = getImportantDatesTargetScope(cleanScopeFilter, cleanScope);

  // Redirect to the visible tab/filter combination so the new row is immediately on screen.
  redirect(
    importantDatesCreatePath({
      view: targetView,
      scope: targetScope,
      createdId: data.id,
    }),
  );
}

export async function updateImportantDate(formData: FormData) {
  const supabase = await createClient();

  const id = getRequiredString(formData, "id");
  const cleanTitle = getRequiredTrimmedString(formData, "title");
  const cleanDate = getRequiredTrimmedString(formData, "date");
  const cleanNotes = getOptionalTrimmedString(formData, "notes");
  const category = formData.get("category");
  const view = formData.get("view");
  const scope = formData.get("scope");
  const scopeFilter = formData.get("scopeFilter");

  if (!id) {
    console.error("Missing or invalid id in updateImportantDate");
    return;
  }

  if (!cleanTitle || !cleanDate) {
    return;
  }

  const cleanCategory = normalizeImportantDateCategory(category);
  const cleanView = normalizeImportantDatesView(view);
  const cleanScope = normalizeVisibilityScope(scope);
  const cleanScopeFilter = normalizeVisibilityFilter(scopeFilter);

  const { error } = await importantDatesTable(supabase)
    .update({
      title: cleanTitle,
      date: cleanDate,
      notes: cleanNotes,
      category: cleanCategory,
      ...(cleanScope ? { scope: cleanScope } : {}),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating important date:", error);
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/dates");

  const targetView = getImportantDatesTargetView(cleanDate, cleanView);
  const targetScope = getImportantDatesTargetScope(
    cleanScopeFilter,
    cleanScope ?? "personal",
  );

  // Editing can move a row between time/scope filters, so redirect to where it now belongs.
  const scopeQuery =
    targetScope === "all" ? "" : `&scope=${targetScope}`;
  redirect(`/dashboard/dates?view=${targetView}${scopeQuery}#date-${id}`);
}

export async function deleteImportantDate(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    console.error("Missing or invalid id in deleteImportantDate");
    return;
  }

  const { error } = await importantDatesTable(supabase)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting important date:", error);
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/dates");
}
