"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const IMPORTANT_DATE_CATEGORIES = [
  "deadline",
  "renewal",
  "event",
  "anniversary",
  "appointment",
  "birthday",
  "other",
] as const;

type ImportantDateCategory = (typeof IMPORTANT_DATE_CATEGORIES)[number];

function normalizeCategory(value: FormDataEntryValue | null): ImportantDateCategory {
  if (typeof value !== "string") return "other";
  const candidate = value.trim().toLowerCase();
  if (
    IMPORTANT_DATE_CATEGORIES.includes(candidate as ImportantDateCategory)
  ) {
    return candidate as ImportantDateCategory;
  }
  return "other";
}

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
  const cleanCategory = normalizeCategory(category);

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
