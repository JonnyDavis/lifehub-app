"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { normalizeImportantDateCategory } from "@/lib/presenters/important-dates";

export async function createImportantDate(formData: FormData) {
  const supabase = await createClient();

  const title = formData.get("title");
  const date = formData.get("date");
  const notes = formData.get("notes");
  const category = formData.get("category");

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return;
  }

  if (!date || typeof date !== "string" || date.trim().length === 0) {
    return;
  }

  const cleanTitle = title.trim();
  const cleanDate = date.trim();
  const cleanNotes =
    typeof notes === "string" && notes.trim().length > 0 ? notes.trim() : null;
  const cleanCategory = normalizeImportantDateCategory(category);

  const { error } = await supabase.from("important_dates").insert({
    title: cleanTitle,
    date: cleanDate,
    notes: cleanNotes,
    category: cleanCategory,
  });

  if (error) {
    console.error("Error creating important date:", error);
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/dates");
}

export async function deleteImportantDate(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id");

  if (!id || typeof id !== "string") {
    console.error("Missing or invalid id in deleteImportantDate");
    return;
  }

  const { error } = await supabase
    .from("important_dates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting important date:", error);
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/dates");
}
