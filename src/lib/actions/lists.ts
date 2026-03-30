"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { normalizeListCategory } from "@/lib/presenters/lists";
import { normalizeListIconKey } from "@/lib/presenters/lists";
import { normalizeVisibilityFilter, normalizeVisibilityScope } from "@/types/visibility";
import type { ListIconKey } from "@/types/lists";
import { listItemsTable, listsTable } from "@/lib/supabase/tables";

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

function parseListCategoryWithDefault(value: unknown) {
  return normalizeListCategory(value) ?? "other";
}

// Keep list-create failures on the index page and preserve the active scope tab.
function listCreateErrorPath(
  scopeFilter: FormDataEntryValue | null,
  error: "missing_title" | "create_failed",
) {
  const cleanScopeFilter = normalizeVisibilityFilter(scopeFilter);
  const params = new URLSearchParams({ error });
  if (cleanScopeFilter !== "all") {
    params.set("scope", cleanScopeFilter);
  }
  return `/dashboard/lists?${params.toString()}`;
}

function parseListIconForUpdate(value: FormDataEntryValue | null): {
  ok: boolean;
  nextIcon: ListIconKey | null;
} {
  // Purpose:
  // - Preserve existing update semantics around the `icon` field:
  //   - `""` (empty string) or `null` means "clear the icon" -> write NULL
  //   - Any non-empty value must normalize to a known `ListIconKey`
  //   - If a non-empty value is invalid, we abort the update entirely so we
  //     don't overwrite the DB with junk.
  //
  // This is intentionally a little strict: it treats unexpected types (e.g.
  // `File`) or unknown strings as invalid input.
  if (value === "" || value === null) return { ok: true, nextIcon: null };
  const nextIcon = normalizeListIconKey(value);
  if (nextIcon === null) return { ok: false, nextIcon: null };
  return { ok: true, nextIcon };
}

export async function createList(formData: FormData) {
  const supabase = await createClient();
  const cleanTitle = getRequiredTrimmedString(formData, "title");
  const category = formData.get("category");
  const scope = formData.get("scope");
  const scopeFilter = formData.get("scopeFilter");

  if (!cleanTitle) {
    redirect(listCreateErrorPath(scopeFilter, "missing_title"));
  }

  const cleanCategory = parseListCategoryWithDefault(category);
  const cleanScope = normalizeVisibilityScope(scope);

  const { data, error } = await listsTable(supabase)
    .insert({
      title: cleanTitle,
      category: cleanCategory,
      ...(cleanScope ? { scope: cleanScope } : {}),
      // missing icon for now
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating list:", error);
    redirect(listCreateErrorPath(scopeFilter, "create_failed"));
  }

  // Update any pages that show lists to reflect the new list
  revalidatePath("/dashboard/lists");
  revalidatePath("/dashboard");

  // Send the user straight into the new list so the next action is obvious.
  redirect(`/dashboard/lists/${data.id}?created=1`);
}

export async function createListItem(formData: FormData) {
  const supabase = await createClient();
  const listId = formData.get("listId");
  const label = formData.get("label");
  const quantity = formData.get("quantity");

  if (!listId || typeof listId !== "string") {
    console.error("Missing or invalid listId in createListItem");
    return;
  }

  if (!label || typeof label !== "string" || label.trim().length === 0) {
    // TODO - return error state to UI
    return;
  }

  const cleanLabel = label.trim();
  const cleanQuantity =
    typeof quantity === "string" && quantity.trim().length > 0
      ? quantity.trim()
      : null;

  const { error } = await listItemsTable(supabase).insert({
    list_id: listId,
    label: cleanLabel,
    quantity: cleanQuantity,
    is_done: false,
    // position: TODO - need to determine the correct position value for the new item
  });

  if (error) {
    console.error("Error creating list item:", error);
    return;
  }

  // Revalidate the list detail page so the new item shows up
  revalidatePath(`/dashboard/lists/${listId}`);
}

export async function toggleListItem(formData: FormData) {
  const supabase = await createClient();
  const itemId = formData.get("itemId");
  const listId = formData.get("listId");
  const nextDone = formData.get("nextDone");

  if (!itemId || typeof itemId !== "string") {
    console.error("Missing or invalid itemId in toggleListItem");
    return;
  }

  if (!listId || typeof listId !== "string") {
    console.error("Missing or invalid listId in toggleListItem");
    return;
  }

  const nextIsDone = nextDone === "true";

  const { error } = await listItemsTable(supabase)
    .update({
      is_done: nextIsDone,
    })
    .eq("id", itemId);

  if (error) {
    console.error("Error toggling list item:", error);
    return;
  }

  revalidatePath(`/dashboard/lists/${listId}`);
}

export async function deleteListItem(formData: FormData) {
  const supabase = await createClient();
  const itemId = formData.get("itemId");
  const listId = formData.get("listId");

  if (!itemId || typeof itemId !== "string") {
    console.error("Missing or invalid itemId in deleteListItem");
    return;
  }

  if (!listId || typeof listId !== "string") {
    console.error("Missing or invalid listId in deleteListItem");
    return;
  }

  const { error } = await listItemsTable(supabase).delete().eq("id", itemId);

  if (error) {
    console.error("Error deleting list item:", error);
    return;
  }

  revalidatePath(`/dashboard/lists/${listId}`);
}

export async function updateList(formData: FormData) {
  const supabase = await createClient();
  const listId = getRequiredString(formData, "listId");
  const cleanTitle = getRequiredTrimmedString(formData, "title");
  const category = formData.get("category");
  const icon = formData.get("icon");
  const scope = formData.get("scope");

  if (!listId) {
    console.error("Missing or invalid listId in updateList");
    return;
  }

  if (!cleanTitle) {
    return;
  }

  const cleanCategory = parseListCategoryWithDefault(category);
  const cleanScope = normalizeVisibilityScope(scope);

  const { ok: iconOk, nextIcon } = parseListIconForUpdate(icon);
  if (!iconOk) {
    return;
  }

  const { error } = await listsTable(supabase)
    .update({
      title: cleanTitle,
      category: cleanCategory,
      icon: nextIcon,
      ...(cleanScope ? { scope: cleanScope } : {}),
    })
    .eq("id", listId);

  if (error) {
    console.error("Error updating list:", error);
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/lists");
  revalidatePath(`/dashboard/lists/${listId}`);
}
