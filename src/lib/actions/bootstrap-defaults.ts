"use server";

// Bootstraps a small default dataset (lists, list items, important dates)
// for each *new* user on their first `/dashboard` load.
//
// Design goals:
// - Strict RLS stays intact: rows are household-scoped, and access is enforced
//   by household membership (via DB defaults + RLS policies).
// - Idempotent: safe if this runs multiple times (refresh/multi-tab).
// - Race-tolerant: only one request "wins" the bootstrap for a user.
// - Keep the code easy to follow: seeded rows get stable `seed_key`s, enforced
//   by unique indexes (see `supabase/migrations/*_add_seed_keys_for_bootstrap.sql`).

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  importantDatesTable,
  listItemsTable,
  listsTable,
  profilesTable,
} from "@/lib/supabase/tables";

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

type DefaultListSeedKey =
  | "groceries"
  | "house-chores"
  | "weekend-trip"
  | "work-admin"
  | "errands";

// Mirrors `supabase/seed.default.sql`, but assigns per-household `seed_key`s so we can
// insert defaults once without deterministic UUID generation.
function getDefaultSeedData(householdId: string) {
  const lists = [
    {
      household_id: householdId,
      seed_key: "groceries" as const,
      title: "Groceries",
      category: "shopping",
      icon: "shopping-cart",
    },
    {
      household_id: householdId,
      seed_key: "house-chores" as const,
      title: "House Chores",
      category: "chores",
      icon: null,
    },
    {
      household_id: householdId,
      seed_key: "weekend-trip" as const,
      title: "Weekend Trip",
      category: "packing",
      icon: "✈️",
    },
    {
      household_id: householdId,
      seed_key: "work-admin" as const,
      title: "Work Admin",
      category: "other",
      icon: "WFH",
    },
    {
      household_id: householdId,
      seed_key: "errands" as const,
      title: "Errands",
      category: "errands",
      // Intentionally invalid icon string to exercise UI fallback behavior.
      icon: "deliveries",
    },
  ];

  const listSeedKeys = lists.map((l) => l.seed_key) as DefaultListSeedKey[];

  const listItems = [
    // Groceries
    {
      list_seed_key: "groceries" as const,
      seed_key: "milk",
      label: "Milk",
      quantity: "2L",
      notes: null,
      is_done: false,
      position: null,
    },
    {
      list_seed_key: "groceries" as const,
      seed_key: "apples",
      label: "Apples",
      quantity: "6",
      notes: null,
      is_done: false,
      position: null,
    },
    {
      list_seed_key: "groceries" as const,
      seed_key: "bread",
      label: "Bread",
      quantity: null,
      notes: null,
      is_done: true,
      position: null,
    },

    // House Chores
    {
      list_seed_key: "house-chores" as const,
      seed_key: "take-out-trash",
      label: "Take out trash",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },
    {
      list_seed_key: "house-chores" as const,
      seed_key: "vacuum-living-room",
      label: "Vacuum living room",
      quantity: null,
      notes: null,
      is_done: true,
      position: null,
    },

    // Weekend Trip
    {
      list_seed_key: "weekend-trip" as const,
      seed_key: "passport",
      label: "Passport",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },
    {
      list_seed_key: "weekend-trip" as const,
      seed_key: "toothbrush",
      label: "Toothbrush",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },

    // Errands
    {
      list_seed_key: "errands" as const,
      seed_key: "post-office",
      label: "Post office",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },
    {
      list_seed_key: "errands" as const,
      seed_key: "pick-up-dry-cleaning",
      label: "Pick up dry cleaning",
      quantity: null,
      notes: null,
      is_done: false,
      position: null,
    },
  ];

  const importantDates = [
    {
      household_id: householdId,
      seed_key: "dentist",
      title: "Dentist",
      date: isoDateAddDaysUTC(10),
      notes: "Bring insurance card",
      category: "appointment",
    },
    {
      household_id: householdId,
      seed_key: "pay-rent",
      title: "Pay rent",
      date: isoDateAddDaysUTC(1),
      notes: null,
      category: "deadline",
    },
    {
      household_id: householdId,
      seed_key: "alex-birthday",
      title: "Alex birthday",
      date: isoDateAddDaysUTC(-14),
      notes: null,
      category: "birthday",
    },
    {
      household_id: householdId,
      seed_key: "concert-tickets",
      title: "Concert tickets",
      date: isoDateAddDaysUTC(60),
      notes: null,
      category: "event",
    },
    {
      household_id: householdId,
      seed_key: "passport-renewal",
      title: "Passport renewal",
      date: isoDateAddDaysUTC(180),
      notes: null,
      category: "renewal",
    },
  ];

  return { lists, listSeedKeys, listItems, importantDates };
}

// Ensure a user has their "starter" dataset.
//
// Called from the authenticated dashboard layout. This is intentionally safe to call
// on every request: it uses `profiles.bootstrap_state` to ensure only one bootstrap
// runs per user, and uses `seed_key` + insert-if-missing semantics to avoid duplicates.
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

  // Ensure the user has a personal household (Phase 1 MVP: one household per user).
  const { data: householdId, error: householdError } = await supabase.rpc(
    "ensure_personal_household",
  );

  if (householdError || !householdId) {
    console.error("Error ensuring personal household:", householdError);
    return;
  }

  // Ensure the per-user `profiles` row exists (used as the bootstrap "lock"/state).
  const { error: ensureProfileError } = await profilesTable(supabase).upsert(
    { user_id: userId },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  if (ensureProfileError) {
    console.error("Error ensuring profile row:", ensureProfileError);
    return;
  }

  // Fast path: if a previous request already bootstrapped this user, do nothing.
  // (The bootstrap route can be visited directly, and we want it to be safe/cheap.)
  const { data: profile, error: profileError } = await profilesTable(supabase)
    .select("bootstrap_state")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error reading profile bootstrap state:", profileError);
  } else if (profile?.bootstrap_state === "done") {
    return;
  }

  // Try to "claim" bootstrapping for this user. Only one request should win, but
  // everything below is also idempotent (unique indexes + ignoreDuplicates).
  const claimTime = new Date().toISOString();
  const staleBefore = new Date(Date.now() - staleClaimAfterMs).toISOString();

  // Claim the bootstrap by transitioning state: not_started -> in_progress.
  const { data: claimed, error: claimError } = await profilesTable(supabase)
    .update({
      bootstrap_state: "in_progress",
      bootstrap_started_at: claimTime,
    })
    .eq("user_id", userId)
    .eq("bootstrap_state", "not_started")
    .select("user_id");

  if (claimError) {
    console.error("Error claiming bootstrap:", claimError);
    return;
  }

  if ((claimed ?? []).length === 0) {
    // Another request is currently bootstrapping. If it's been "stuck" too long,
    // reclaim it so the user can recover from partial failures.
    // If it's not stale, we still proceed (writes are idempotent) to avoid
    // redirect loops when state is `in_progress`.
    const { error: reclaimError } = await profilesTable(supabase)
      .update({
        bootstrap_state: "in_progress",
        bootstrap_started_at: claimTime,
      })
      .eq("user_id", userId)
      .eq("bootstrap_state", "in_progress")
      .lt("bootstrap_started_at", staleBefore);

    if (reclaimError) {
      console.error("Error reclaiming stale bootstrap:", reclaimError);
      return;
    }

    // If it's not stale, another request is likely finishing the bootstrap.
    // Continue anyway: inserts are idempotent (unique indexes + ignoreDuplicates).
  }

  try {
    // Safety valve: if the user already has real data, don't inject defaults.
    // Mark bootstrap as done so we don't keep trying.
    const { data: existingLists, error: existingListsError } = await listsTable(
      supabase,
    )
      .select("id")
      .eq("household_id", householdId)
      .limit(1);
    if (existingListsError) throw existingListsError;

    const { data: existingDates, error: existingDatesError } =
      await importantDatesTable(supabase)
        .select("id")
        .eq("household_id", householdId)
        .limit(1);
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

    const { lists, listSeedKeys, listItems, importantDates } =
      getDefaultSeedData(householdId);

    // Insert-if-missing for seeded rows (avoid overwriting any user edits).
    const { error: listsError } = await listsTable(supabase).upsert(lists, {
      onConflict: "household_id,seed_key",
      ignoreDuplicates: true,
    });
    if (listsError) throw listsError;

    const { data: seededLists, error: seededListsError } = await listsTable(
      supabase,
    )
      .select("id, seed_key")
      .eq("household_id", householdId)
      .in("seed_key", listSeedKeys);
    if (seededListsError) throw seededListsError;

    const listIdBySeedKey = new Map<string, string>(
      (seededLists ?? []).map((l) => [l.seed_key as string, l.id as string]),
    );

    for (const seedKey of listSeedKeys) {
      if (!listIdBySeedKey.has(seedKey)) {
        throw new Error(`Missing seeded list id for seed_key=${seedKey}`);
      }
    }

    // list_items references `lists.id`, so we need a mapping step from our human
    // `seed_key` identifiers -> the actual list UUIDs created by Postgres.
    const listItemsWithListIds = listItems.map((item) => ({
      list_id: listIdBySeedKey.get(item.list_seed_key)!,
      seed_key: item.seed_key,
      label: item.label,
      quantity: item.quantity,
      notes: item.notes,
      is_done: item.is_done,
      position: item.position,
    }));

    // Upsert list items after lists exist so list_items RLS (via parent list) passes.
    const { error: itemsError } = await listItemsTable(supabase).upsert(
      listItemsWithListIds,
      {
        onConflict: "list_id,seed_key",
        ignoreDuplicates: true,
      },
    );
    if (itemsError) throw itemsError;

    const { error: datesError } = await importantDatesTable(supabase).upsert(
      importantDates,
      { onConflict: "household_id,seed_key", ignoreDuplicates: true },
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
