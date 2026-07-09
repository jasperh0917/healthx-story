"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";

async function ensureHead() {
  const u = await getCurrentUser();
  if (u?.role !== "head") throw new Error("Only the department head can change groupings.");
  return await createClient();
}

function done() {
  revalidatePath("/renewals/groups");
  revalidatePath("/renewals");
  revalidatePath("/");
}

/** Merge the given policies into one master group (anchored on `anchor`). */
export async function combinePolicies(clients: string[], anchor: string) {
  const supabase = await ensureHead();
  const { error } = await supabase.rpc("jasper_combine_policies", {
    p_clients: clients,
    p_anchor: anchor,
  });
  if (error) throw new Error(error.message);
  done();
}

/** Split each given policy out into its own master group. */
export async function splitPolicies(clients: string[]) {
  const supabase = await ensureHead();
  const { error } = await supabase.rpc("jasper_split_policies", { p_clients: clients });
  if (error) throw new Error(error.message);
  done();
}

/** Revert each given policy to the automatic (name-based) grouping. */
export async function revertPolicies(clients: string[]) {
  const supabase = await ensureHead();
  const { error } = await supabase.rpc("jasper_revert_policies", { p_clients: clients });
  if (error) throw new Error(error.message);
  done();
}

/** Set (or clear, with "") the display name for one master policy. */
export async function setPolicyDisplay(id: string, name: string) {
  const supabase = await ensureHead();
  const { error } = await supabase.rpc("jasper_set_policy_display", { p_id: id, p_name: name });
  if (error) throw new Error(error.message);
  done();
}
