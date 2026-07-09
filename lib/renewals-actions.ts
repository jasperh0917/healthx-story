"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function emptyToNull(v: FormDataEntryValue | null): string | null {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : null;
}
function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = typeof v === "string" ? v.replace(/[, ]/g, "") : "";
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n) : null; // premiums & census are whole numbers
}
function floatOrNull(v: FormDataEntryValue | null): number | null {
  const s = typeof v === "string" ? v.replace(/[, ]/g, "") : "";
  if (!s || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null; // % Δ keeps decimals & sign
}

// Update the editable tracking fields on one renewal. TRR-sourced facts (name,
// broker, expiry, live NLR) are never touched here — they stay live from TRR.
export async function updateRenewal(id: string, formData: FormData) {
  const supabase = await createClient();

  const patch = {
    status: (emptyToNull(formData.get("status")) ?? "In Progress") as string,
    renewal_sent_date: emptyToNull(formData.get("renewal_sent_date")),
    renewal_premium: numOrNull(formData.get("renewal_premium")),
    quote_census: numOrNull(formData.get("quote_census")),
    referred_qic_date: emptyToNull(formData.get("referred_qic_date")),
    final_renewed_premium: numOrNull(formData.get("final_renewed_premium")),
    final_census: numOrNull(formData.get("final_census")),
    pct_delta: floatOrNull(formData.get("pct_delta")),
    renewed_product: emptyToNull(formData.get("renewed_product")),
    lost_reason: emptyToNull(formData.get("lost_reason")),
    renewed_broker: emptyToNull(formData.get("renewed_broker")),
    renewed_insurer: emptyToNull(formData.get("renewed_insurer")),
    notes: emptyToNull(formData.get("notes")),
    assigned_to: emptyToNull(formData.get("assigned_to")),
    updated_at: new Date().toISOString(),
  };

  await supabase.from("jasper_renewals").update(patch).eq("id", id);

  revalidatePath(`/renewals/${id}`);
  revalidatePath("/renewals");
  redirect(`/renewals/${id}?saved=1`);
}

// Inline (spreadsheet-style) edit — patch one or more fields on a renewal
// straight from the tracker table, without navigating away.
const TEXT_FIELDS = new Set(["renewal_sent_date", "status", "notes", "assigned_to", "renewed_product"]);
const NUM_FIELDS = new Set(["renewal_premium", "quote_census", "final_renewed_premium", "final_census"]);
const FLOAT_FIELDS = new Set(["pct_delta"]);

export async function patchRenewal(id: string, patch: Record<string, string>) {
  const supabase = await createClient();
  const clean: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const [k, raw] of Object.entries(patch)) {
    if (TEXT_FIELDS.has(k)) clean[k] = emptyToNull(raw);
    else if (NUM_FIELDS.has(k)) clean[k] = numOrNull(raw);
    else if (FLOAT_FIELDS.has(k)) clean[k] = floatOrNull(raw);
  }
  await supabase.from("jasper_renewals").update(clean).eq("id", id);
  revalidatePath("/renewals");
}
