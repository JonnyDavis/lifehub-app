import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  LIST_ITEMS_SELECT,
  LISTS_SELECT,
  listItemsTable,
  listsTable,
} from "@/lib/supabase/tables";
import type { List, ListItem } from "@/types/lists";

export async function getLists() {
  const supabase = await createClient();
  const { data: lists, error } = await listsTable(supabase)
    .select(LISTS_SELECT)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching lists:", error);
    throw error;
  }

  return (lists ?? []) as List[];
}

export async function getListById(id: string) {
  const supabase = await createClient();
  const { data: list, error: error } = await listsTable(supabase)
    .select(LISTS_SELECT)
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

  return (list ?? null) as List | null;
}

// Server only function to fetch list by ID and throw 404 if not found
export async function requireListById(id: string) {
  const list = await getListById(id);
  if (!list) notFound();
  return list;
}

export async function getListItems(listId: string) {
  const supabase = await createClient();
  const { data: items, error } = await listItemsTable(supabase)
    .select(LIST_ITEMS_SELECT)
    .eq("list_id", listId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching list items:", error);
    throw error;
  }

  return (items ?? []) as ListItem[];
}
