"use server";

// Bootstraps a small default dataset (lists, list items, important dates)
// for each *new* user on their first `/dashboard` load.
//
// Design goals:
// - Strict RLS stays intact: rows are owned by `auth.uid()` (via DB defaults).
// - Idempotent: safe if this runs multiple times (refresh/multi-tab).
// - Race-tolerant: only one request "wins" the bootstrap for a user.

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  importantDatesTable,
  listItemsTable,
  listsTable,
  profilesTable,
} from "@/lib/supabase/tables";

// Stable UUID namespace for deterministic IDs. Do not change once deployed,
// otherwise the same user would get a different set of IDs on re-run.
const UUID_NAMESPACE_LIFEHUB = "9c1e1f4c-1d2b-4b5e-9a9b-0d3a7c5b2a11";

// UUID helpers for RFC 4122 v5 generation.
function uuidToBytes(uuid: string) {
  const hex = uuid.replace(/-/g, "");
  if (hex.length !== 32) {
    throw new Error(`Invalid UUID: ${uuid}`);
  }
  return Buffer.from(hex, "hex");
}

function bytesToUuid(bytes: Buffer) {
  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

// RFC 4122 UUID v5 (SHA-1) for stable, idempotent IDs.
function uuidv5(name: string, namespace: string) {
  const nsBytes = uuidToBytes(namespace);
  const nameBytes = Buffer.from(name, "utf8");
  const hash = createHash("sha1").update(nsBytes).update(nameBytes).digest();

  const bytes = Buffer.from(hash.slice(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC 4122
  return bytesToUuid(bytes);
}

// Generates a YYYY-MM-DD string relative to today's UTC midnight.
function isoDateAddDaysUTC(days: number) {
  const now = new Date();
  const utcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const next = new Date(utcMidnight + days * 24 * 60 * 60 * 1000);
  return next.toISOString().slice(0, 10);
}

type DefaultListKey =
  | "groceries"
  | "house-chores"
  | "weekend-trip"
  | "work-admin"
  | "errands";

// Mirrors `supabase/seed.default.sql`, but generates per-user stable IDs so we can
// safely upsert and avoid duplicates.
function getDefaultSeedData(userId: string) {
  const listIdFor = (key: DefaultListKey) =>
    uuidv5(`${userId}:lists:${key}`, UUID_NAMESPACE_LIFEHUB);

  const lists = [
    {
      id: listIdFor("groceries"),
      title: "Groceries",
      category: "shopping",
      icon: "shopping-cart",
    },
    {
      id: listIdFor("house-chores"),
      title: "House Chores",
      category: "chores",
      icon: null,
    },
    {
      id: listIdFor("weekend-trip"),
      title: "Weekend Trip",
      category: "packing",
      icon: "✈️",
    },
    {
      id: listIdFor("work-admin"),
      title: "Work Admin",
      category: "other",
      icon: "WFH",
    },
    {
      id: listIdFor("errands"),
      title: "Errands",
      category: "errands",
      // Intentionally invalid icon string to exercise UI fallback behavior.
      icon: "deliveries",
    },
  ] as const;

  const listItems = [
    // Groceries
    {
      id: uuidv5(`${userId}:list_items:groceries:milk`, UUID_NAMESPACE_LIFEHUB),
      list_id: listIdFor("groceries"),
      label: "Milk",
      quantity: "2L",
      notes: null,
      is_done: false,
      position: null,
    },
    {
      id: uuidv5(
        `${userId}:list_items:groceries:apples`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      list_id: listIdFor("groceries"),
      label: "Apples",
      quantity: "6",
      notes: null,
      is_done: false,
      position: null,
    },
    {
      id: uuidv5(
        `${userId}:list_items:groceries:bread`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      list_id: listIdFor("groceries"),
      label: "Bread",
      quantity: null,
      notes: null,
      is_done: true,
      position: null,
    },

    // House Chores
    {
      id: uuidv5(
        `${userId}:list_items:house-chores:take-out-trash`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      list_id: listIdFor("house-chores"),
      label: "Take out trash",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },
    {
      id: uuidv5(
        `${userId}:list_items:house-chores:vacuum-living-room`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      list_id: listIdFor("house-chores"),
      label: "Vacuum living room",
      quantity: null,
      notes: null,
      is_done: true,
      position: null,
    },

    // Weekend Trip
    {
      id: uuidv5(
        `${userId}:list_items:weekend-trip:passport`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      list_id: listIdFor("weekend-trip"),
      label: "Passport",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },
    {
      id: uuidv5(
        `${userId}:list_items:weekend-trip:toothbrush`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      list_id: listIdFor("weekend-trip"),
      label: "Toothbrush",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },

    // Errands
    {
      id: uuidv5(
        `${userId}:list_items:errands:post-office`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      list_id: listIdFor("errands"),
      label: "Post office",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },
    {
      id: uuidv5(
        `${userId}:list_items:errands:pick-up-dry-cleaning`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      list_id: listIdFor("errands"),
      label: "Pick up dry cleaning",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },
  ] as const;

  const importantDates = [
    {
      id: uuidv5(`${userId}:important_dates:dentist`, UUID_NAMESPACE_LIFEHUB),
      title: "Dentist",
      date: isoDateAddDaysUTC(10),
      notes: "Bring insurance card",
      category: "appointment",
    },
    {
      id: uuidv5(`${userId}:important_dates:pay-rent`, UUID_NAMESPACE_LIFEHUB),
      title: "Pay rent",
      date: isoDateAddDaysUTC(1),
      notes: null,
      category: "deadline",
    },
    {
      id: uuidv5(
        `${userId}:important_dates:alex-birthday`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      title: "Alex birthday",
      date: isoDateAddDaysUTC(-14),
      notes: null,
      category: "birthday",
    },
    {
      id: uuidv5(
        `${userId}:important_dates:concert-tickets`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      title: "Concert tickets",
      date: isoDateAddDaysUTC(60),
      notes: null,
      category: "event",
    },
    {
      id: uuidv5(
        `${userId}:important_dates:passport-renewal`,
        UUID_NAMESPACE_LIFEHUB,
      ),
      title: "Passport renewal",
      date: isoDateAddDaysUTC(180),
      notes: null,
      category: "renewal",
    },
  ] as const;

  return { lists, listItems, importantDates };
}

// Ensure a user has their "starter" dataset.
//
// Called from the authenticated dashboard layout. This is intentionally safe to call
// on every request: it uses `profiles.bootstrap_state` to ensure only one bootstrap
// runs per user, and uses deterministic IDs + upserts to make re-runs harmless.
export async function ensureUserBootstrappedDefaults(
  supabase: SupabaseClient,
  { staleClaimAfterMs = 5 * 60 * 1000 }: { staleClaimAfterMs?: number } = {},
) {
  // Must run in an authenticated context (server client with cookies).
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return;
  }

  const userId = userData.user.id;

  // Ensure the per-user `profiles` row exists (used as the bootstrap "lock"/state).
  const { error: ensureProfileError } = await profilesTable(supabase).upsert(
    { user_id: userId },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  if (ensureProfileError) {
    console.error("Error ensuring profile row:", ensureProfileError);
    return;
  }

  const claimTime = new Date().toISOString();
  const staleBefore = new Date(Date.now() - staleClaimAfterMs).toISOString();

  // Claim the bootstrap by transitioning state: not_started -> in_progress.
  const claim = async () => {
    const { data: claimed, error: claimError } = await profilesTable(supabase)
      .update({
        bootstrap_state: "in_progress",
        bootstrap_started_at: claimTime,
      })
      .eq("user_id", userId)
      .eq("bootstrap_state", "not_started")
      .select("user_id");

    if (claimError) return { claimed: false, error: claimError };
    return { claimed: (claimed ?? []).length > 0, error: null };
  };

  const { claimed, error: claimError } = await claim();

  if (claimError) {
    console.error("Error claiming bootstrap:", claimError);
    return;
  }

  if (!claimed) {
    // Another request is currently bootstrapping. If it's been "stuck" too long,
    // reclaim it so the user can recover from partial failures.
    const { data: reclaimed, error: reclaimError } = await profilesTable(
      supabase,
    )
      .update({
        bootstrap_state: "in_progress",
        bootstrap_started_at: claimTime,
      })
      .eq("user_id", userId)
      .eq("bootstrap_state", "in_progress")
      .lt("bootstrap_started_at", staleBefore)
      .select("user_id");

    if (reclaimError) {
      console.error("Error reclaiming stale bootstrap:", reclaimError);
      return;
    }

    if ((reclaimed ?? []).length === 0) {
      return;
    }
  }

  try {
    // Safety valve: if the user already has real data, don't inject defaults.
    // Mark bootstrap as done so we don't keep trying.
    const { data: existingLists, error: existingListsError } = await listsTable(
      supabase,
    )
      .select("id")
      .limit(1);
    if (existingListsError) throw existingListsError;

    const { data: existingDates, error: existingDatesError } =
      await importantDatesTable(supabase).select("id").limit(1);
    if (existingDatesError) throw existingDatesError;

    if ((existingLists ?? []).length > 0 || (existingDates ?? []).length > 0) {
      const { error: doneError } = await profilesTable(supabase)
        .update({
          bootstrap_state: "done",
          bootstrapped_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .select("user_id");

      if (doneError) {
        console.error("Error marking bootstrap complete:", doneError);
      }

      return;
    }

    const { lists, listItems, importantDates } = getDefaultSeedData(userId);

    // Upsert in dependency order so list_items RLS (via parent list) passes.
    const { error: listsError } = await listsTable(supabase).upsert(lists, {
      onConflict: "id",
    });
    if (listsError) throw listsError;

    const { error: itemsError } = await listItemsTable(supabase).upsert(
      listItems,
      {
        onConflict: "id",
      },
    );
    if (itemsError) throw itemsError;

    const { error: datesError } = await importantDatesTable(supabase).upsert(
      importantDates,
      { onConflict: "id" },
    );
    if (datesError) throw datesError;

    // Mark complete.
    const { error: doneError } = await profilesTable(supabase)
      .update({
        bootstrap_state: "done",
        bootstrapped_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .select("user_id");

    if (doneError) {
      console.error("Error marking bootstrap complete:", doneError);
    }
  } catch (error) {
    // If anything fails, reset so a future request can retry.
    console.error("Error bootstrapping default data:", error);
    const { error: resetError } = await profilesTable(supabase)
      .update({
        bootstrap_state: "not_started",
        bootstrap_started_at: null,
      })
      .eq("user_id", userId);

    if (resetError) {
      console.error("Error resetting bootstrap state:", resetError);
    }
  }
}
