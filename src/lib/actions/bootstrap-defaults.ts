"use server";

// Lightweight account provisioning for first dashboard load.
//
// Product decision:
// - Every user gets a personal workspace.
// - Invite-first users should still land in the shared workspace they joined.
// - We no longer inject starter lists/dates automatically during provisioning.
//
// This helper therefore only ensures the per-user/profile state and the
// existence of a personal workspace, then marks provisioning complete.

import type { SupabaseClient } from "@supabase/supabase-js";

import { profilesTable } from "@/lib/supabase/tables";

export async function ensureUserBootstrappedDefaults(
  supabase: SupabaseClient,
) {
  // Provisioning always starts from the authenticated auth user. If we do not
  // have a real user here, the caller should treat provisioning as failed and
  // bounce back through login rather than trying to continue into the app.
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return false;
  }

  const userId = userData.user.id;

  const { error: ensureProfileError } = await profilesTable(supabase).upsert(
    { user_id: userId },
    { onConflict: "user_id", ignoreDuplicates: true },
  );

  if (ensureProfileError) {
    console.error("Error ensuring profile row:", ensureProfileError);
    return false;
  }

  const { data: profile, error: profileError } = await profilesTable(supabase)
    .select("bootstrap_state, active_household_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("Error reading profile bootstrap state:", profileError);
    return false;
  }

  // `bootstrap_state` is our coarse "account provisioning completed" marker.
  // We also require an active workspace before calling the user fully ready.
  if (
    profile?.bootstrap_state === "done" &&
    profile.active_household_id !== null
  ) {
    return true;
  }

  const claimTime = new Date().toISOString();
  const { error: claimError } = await profilesTable(supabase)
    .update({
      bootstrap_state: "in_progress",
      bootstrap_started_at: claimTime,
    })
    .eq("user_id", userId);

  if (claimError) {
    console.error("Error claiming bootstrap:", claimError);
    return false;
  }

  try {
    // Provisioning is intentionally separate from normal workspace-scoped CRUD.
    // This helper ensures the user's personal workspace exists even if they
    // reached the dashboard through an invite into a shared workspace.
    const {
      data: personalHouseholdId,
      error: householdError,
    } = await supabase.rpc("ensure_bootstrap_personal_household");

    if (householdError || !personalHouseholdId) {
      console.error(
        "Error ensuring bootstrap personal household:",
        householdError,
      );
      throw householdError ?? new Error("missing personal household id");
    }

    // Invite-first users may already have an active shared workspace via
    // `/household/join`. Only set the active workspace here when none exists yet.
    if (profile?.active_household_id === null) {
      const { error: setActiveError } = await supabase.rpc("set_active_household", {
        p_household_id: personalHouseholdId,
      });

      if (setActiveError) {
        console.error("Error setting initial active household:", setActiveError);
        throw setActiveError;
      }
    }

    // We deliberately do not create starter lists/dates here anymore. Once the
    // personal workspace exists (and active is set if needed), provisioning is
    // complete and the app can render its normal empty states.
    const { error: doneError } = await profilesTable(supabase)
      .update({
        bootstrap_state: "done",
        bootstrapped_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (doneError) {
      console.error("Error marking bootstrap complete:", doneError);
      throw doneError;
    }

    return true;
  } catch (error) {
    console.error("Error provisioning user account:", error);

    // Reset back to `not_started` so a future request can retry provisioning
    // instead of leaving the user stuck in a permanent half-provisioned state.
    const { error: resetError } = await profilesTable(supabase)
      .update({
        bootstrap_state: "not_started",
        bootstrap_started_at: null,
      })
      .eq("user_id", userId);

    if (resetError) {
      console.error("Error resetting bootstrap state:", resetError);
    }

    return false;
  }
}
