"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { normalizeImportantDateCategory } from "@/lib/presenters/important-dates";
import { normalizeImportantDatesView } from "@/types/important-dates";
import { importantDatesTable } from "@/lib/supabase/tables";

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

  const { error } = await importantDatesTable(supabase).insert({
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

export async function updateImportantDate(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id");
  const title = formData.get("title");
  const date = formData.get("date");
  const notes = formData.get("notes");
  const category = formData.get("category");
  const view = formData.get("view");

  if (!id || typeof id !== "string") {
    console.error("Missing or invalid id in updateImportantDate");
    return;
  }

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
  const cleanView = normalizeImportantDatesView(view);

  const { error } = await importantDatesTable(supabase)
    .update({
      title: cleanTitle,
      date: cleanDate,
      notes: cleanNotes,
      category: cleanCategory,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating important date:", error);
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/dates");

  const today = todayISODateLocal();
  const isUpcoming = cleanDate >= today;
  const isPast = cleanDate < today;

  const viewStillMatches =
    cleanView === "all"
      ? true
      : cleanView === "upcoming"
        ? isUpcoming
        : cleanView === "past"
          ? isPast
          : cleanView === "month"
            ? cleanDate.slice(0, 7) === currentMonthISO()
            : true;

  const targetView = viewStillMatches
    ? cleanView
    : cleanView === "month"
      ? cleanDate.slice(0, 7) === currentMonthISO()
        ? "month"
        : isUpcoming
          ? "upcoming"
          : "past"
      : isUpcoming
        ? "upcoming"
        : "past";

  redirect(`/dashboard/dates?view=${targetView}#date-${id}`);
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
