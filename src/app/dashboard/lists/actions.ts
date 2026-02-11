"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export async function createList(formData: FormData) {
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
