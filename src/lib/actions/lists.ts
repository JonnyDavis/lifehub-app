"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function createList(formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title");
  const type = formData.get("type");

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    // TODO - handle this error properly in the UI
    return;
  }

  const cleanTitle = title.trim();
  const cleanType =
    typeof type === "string" && type.trim().length > 0 ? type.trim() : null;

  const { error } = await supabase.from("lists").insert({
    title: cleanTitle,
    type: cleanType,
    // missing icon for now
  });

  if (error) {
    console.error("Error creating list:", error);
    // TODO - handle this error properly in the UI
    return;
  }

  // Update any pages that show lists to reflect the new list
  revalidatePath("/dashboard/lists");
  revalidatePath("/dashboard");

  redirect("/dashboard/lists");
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

  const { error } = await supabase.from("list_items").insert({
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

  const { error } = await supabase
    .from("list_items")
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

  const { error } = await supabase.from("list_items").delete().eq("id", itemId);

  if (error) {
    console.error("Error deleting list item:", error);
    return;
  }

  revalidatePath(`/dashboard/lists/${listId}`);
}
