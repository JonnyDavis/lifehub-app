import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

export async function getLists() {
  const { data: lists, error } = await supabase
    .from("lists")
    .select("id, title, icon, type")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching lists:", error);
    throw error;
  }

  return lists ?? [];
}

export async function getListById(id: string) {
  const { data: list, error: error } = await supabase
    .from("lists")
    .select("id, title, icon, type")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    // Postgres: invalid input syntax for type uuid
    // Happens when id isn't a uuid, e.g. /dashboard/lists/groceries
    if (error.code === "22P02") {
      return null;
    }

    console.error("Error fetching list by ID:", error);
    throw error;
  }

  return list; // list | null
}

// Server only function to fetch list by ID and throw 404 if not found
export async function requireListById(id: string) {
  const list = await getListById(id);
  if (!list) notFound();
  return list;
}

export async function getListItems(listId: string) {
  const { data: items, error } = await supabase
    .from("list_items")
    .select("id, label, quantity, is_done, position")
    .eq("list_id", listId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching list items:", error);
    throw error;
  }

  return items ?? [];
}