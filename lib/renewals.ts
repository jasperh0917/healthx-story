// Renewal tracker data access. Reads the live tracker view (tracking state +
// live TRR facts, consolidated to Master Contract) through the signed-in staff
// session, walled by team. Columns mirror WellX's Excel "Renewal Tracker".
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isDemoMode } from "@/lib/demo-mode-server";
import { demoAlias, demoBrokerAlias } from "@/lib/demo-mode";

// In demo mode, swap every client/broker name a row exposes for a stable
// pseudonym — so real names never reach the browser during a screen-share.
function maskRow(r: TrackerRow): TrackerRow {
  const groupAlias = demoAlias(r.master_key || r.group_name);
  const brokerAlias = r.broker || r.broker_display ? demoBrokerAlias(r.broker || r.broker_display) : null;
  return {
    ...r,
    group_name: groupAlias,
    group_display: groupAlias,
    display_override: r.display_override ? groupAlias : r.display_override,
    broker: r.broker ? brokerAlias : r.broker,
    broker_display: r.broker_display ? brokerAlias : r.broker_display,
  };
}

export type TrackerRow = {
  id: string;
  group_name: string; // Master Contract (raw)
  group_display: string; // cleaned / overridden display name
  display_override: string | null;
  master_key: string;
  product_line: string | null;
  broker: string | null; // raw
  broker_display: string | null; // cleaned / overridden
  underwriting_year: string | null;
  expiry_date: string | null;
  days_to_expiry: number | null;
  start_month: string | null;
  start_year: number | null;
  sub_policies: number | null;
  live_nlr: number | null; // TRR NLR (live, now)
  static_nlr: number | null; // frozen NLR snapshot at first quote
  static_nlr_at: string | null;
  pct_delta: number | null; // renewal premium vs last year's gross, %
  sent_days_before: number | null; // days before expiry the renewal was sent
  net_premium: number | null;
  gross_premium: number | null;
  // underwriter-entered (mirror the sheet)
  renewal_sent_date: string | null;
  renewal_premium: number | null;
  quote_census: number | null;
  status: "In Progress" | "Renewed" | "Lost";
  final_renewed_premium: number | null;
  final_census: number | null;
  renewed_product: string | null;
  referred_qic_date: string | null;
  lost_reason: string | null;
  renewed_broker: string | null;
  renewed_insurer: string | null;
  notes: string | null;
  assigned_to: string | null;
  // auto-computed helpers
  sent_on_time: boolean | null;
  quote_status: string | null; // "Released on time - 30 days"
  feeling: string | null; // "Positive" / "Not good"
};

export type TrackerView = "upcoming" | "chase" | "all";

/** The renewal list for the current user, filtered by team, window and search. */
export async function listRenewals(
  view: TrackerView = "upcoming",
  search = "",
): Promise<TrackerRow[]> {
  const supabase = await createClient();
  const user = await getCurrentUser();

  let q = supabase.from("jasper_tracker").select("*");

  // Team wall: members see only their own product line; the head sees all.
  if (user?.role === "member" && user.product_line) {
    q = q.eq("product_line", user.product_line);
  }

  if (view === "upcoming") {
    q = q.gte("days_to_expiry", 0).lte("days_to_expiry", 120);
  } else if (view === "chase") {
    q = q.gte("days_to_expiry", -15).lt("days_to_expiry", 0);
  }

  if (search.trim()) {
    q = q.ilike("group_name", `%${search.trim()}%`);
  }

  q = q.order("days_to_expiry", { ascending: true }).limit(1000);

  const { data } = await q;
  const rows = (data ?? []) as TrackerRow[];
  return (await isDemoMode()) ? rows.map(maskRow) : rows;
}

/** One renewal (master contract). */
export async function getRenewal(id: string): Promise<TrackerRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jasper_tracker")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as TrackerRow;
  return (await isDemoMode()) ? maskRow(row) : row;
}
