// ─────────────────────────────────────────────────────────────────────────────
// Renewal Dashboard — data layer (LIVE).
//
// Reads the same authenticated, team-walled tracker rows the rest of the app
// uses (lib/renewals.listRenewals → view `jasper_tracker`, which joins the
// tracking overlay onto live TRR facts). Aggregates them into the two cards.
//
// Grouping matches the tracker exactly: a renewal's month is its UPCOMING start
// month = expiry_date + 1 day (same as TrackerTable.periodOf), so the dashboard
// figures reconcile with what the tracker's Month filter shows.
//
//   Card 1 (renewed)  = status "Renewed",   premium = final_renewed_premium
//                       (fallback renewal_premium), this month vs last month.
//   Card 2 (pipeline) = status "In Progress", premium = renewal_premium
//                       (fallback gross_premium), across the 2 target months.
//   Risk band         = riskTier(live_nlr ?? static_nlr).
//
// Never fabricates: on a read failure the payload comes back `live: false` with
// zeroed figures so the UI can show a dash rather than a guess.
// ─────────────────────────────────────────────────────────────────────────────
import { RISK_TIERS, riskTier, type RiskTier } from "@/lib/risk";
import { listRenewals, type TrackerRow } from "@/lib/renewals";
import type {
  RiskBucket,
  MonthPremium,
  RenewedPremiumMetrics,
  PipelineMonth,
  PipelineReport,
  DashboardData,
} from "@/lib/dashboard-shared";

// Response shapes + pctRenewed live in dashboard-shared.ts (server-free) so that
// "use client" components can import them without pulling this module's server
// graph (listRenewals → next/headers) into the browser bundle. Re-export the
// types here for convenience; client code should import from dashboard-shared.
export type {
  RiskBucket,
  MonthPremium,
  RenewedPremiumMetrics,
  PipelineMonth,
  PipelineReport,
  DashboardData,
} from "@/lib/dashboard-shared";

// ── Month helpers (date-driven) ──────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
/** New Date offset by whole months (handles year rollover). */
function shiftMonth(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

/** A renewal's month key = upcoming start month = expiry_date + 1 day. */
function periodKeyOf(r: TrackerRow): string | null {
  if (!r.expiry_date) return null;
  const d = new Date(r.expiry_date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return monthKey(d);
}

/**
 * Card 2 rule. Before the 16th we still care about closing out the tail of the
 * book (current + last month); from the 16th we look ahead (current + next).
 */
export function pipelineTargetMonths(now: Date): { mode: "early" | "late"; months: Date[] } {
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  if (now.getDate() <= 15) {
    return { mode: "early", months: [current, shiftMonth(current, -1)] };
  }
  return { mode: "late", months: [current, shiftMonth(current, +1)] };
}

// ── Aggregation ──────────────────────────────────────────────────────────────

const nz = (n: number | null | undefined) => (typeof n === "number" && Number.isFinite(n) ? n : 0);

const emptyBucket = (tier: RiskTier): RiskBucket => ({ tier, premium: 0, bookBase: 0, groups: 0, bookGroups: 0 });
const sumPremium = (b: RiskBucket[]) => b.reduce((a, x) => a + x.premium, 0);
const sumBookBase = (b: RiskBucket[]) => b.reduce((a, x) => a + x.bookBase, 0);
const sumGroups = (b: RiskBucket[]) => b.reduce((a, x) => a + x.groups, 0);

function combineByRisk(months: { byRisk: RiskBucket[] }[]): RiskBucket[] {
  return RISK_TIERS.map((tier) => {
    const out = emptyBucket(tier);
    for (const m of months) {
      const b = m.byRisk.find((x) => x.tier === tier);
      if (b) {
        out.premium += b.premium;
        out.bookBase += b.bookBase;
        out.groups += b.groups;
        out.bookGroups += b.bookGroups;
      }
    }
    return out;
  });
}

// Premium pickers (fallbacks keep a figure showing when the ideal field is blank).
const renewedPremium = (r: TrackerRow) => nz(r.final_renewed_premium) || nz(r.renewal_premium);
const pipelinePremium = (r: TrackerRow) => nz(r.renewal_premium) || nz(r.gross_premium);
const priorYearPremium = (r: TrackerRow) => nz(r.gross_premium); // the expiring policy's gross

/**
 * Card 1. % Renewed = renewed booked premium ÷ prior-year premium of EVERY policy
 * up for renewal this month, so `premium` counts only the renewed while the
 * denominator `bookBase` sweeps all statuses in the bucket.
 */
function renewedMonth(rows: TrackerRow[], d: Date): MonthPremium {
  const key = monthKey(d);
  const monthRows = rows.filter((r) => periodKeyOf(r) === key);
  const acc = new Map<RiskTier, RiskBucket>();
  for (const tier of RISK_TIERS) acc.set(tier, emptyBucket(tier));
  for (const r of monthRows) {
    const tier = riskTier(r.live_nlr ?? r.static_nlr);
    if (!tier) continue; // ungraded (no NLR) — can't place on the risk scale
    const b = acc.get(tier)!;
    b.bookBase += priorYearPremium(r); // denominator: all up for renewal (prior-year gross)
    b.bookGroups += 1; // count every policy up for renewal (drill-down set)
    if (r.status === "Renewed") {
      b.premium += renewedPremium(r); // numerator: new premium booked (headline + bars)
      b.groups += 1;
    }
  }
  const byRisk = RISK_TIERS.map((tier) => acc.get(tier)!);
  return {
    monthKey: key,
    monthLabel: monthLabel(d),
    total: sumPremium(byRisk),
    bookBase: sumBookBase(byRisk),
    groups: sumGroups(byRisk),
    byRisk,
  };
}

function pipelineForMonth(rows: TrackerRow[], d: Date): PipelineMonth {
  const key = monthKey(d);
  const acc = new Map<RiskTier, RiskBucket>();
  for (const tier of RISK_TIERS) acc.set(tier, emptyBucket(tier));
  for (const r of rows) {
    if (r.status !== "In Progress" || periodKeyOf(r) !== key) continue;
    const tier = riskTier(r.live_nlr ?? r.static_nlr);
    if (!tier) continue;
    const b = acc.get(tier)!;
    b.premium += pipelinePremium(r);
    b.groups += 1;
  }
  const byRisk = RISK_TIERS.map((tier) => acc.get(tier)!);
  return { monthKey: key, monthLabel: monthLabel(d), total: sumPremium(byRisk), accounts: sumGroups(byRisk), byRisk };
}

/** Pure aggregator — rows in, dashboard payload out. Kept separate for testing. */
export function buildDashboardData(rows: TrackerRow[], now: Date, live = true): DashboardData {
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = shiftMonth(currentMonth, -1);

  const renewed: RenewedPremiumMetrics = {
    current: renewedMonth(rows, currentMonth),
    last: renewedMonth(rows, lastMonth),
  };

  const { mode, months } = pipelineTargetMonths(now);
  const pipelineMonths = months.map((d) => pipelineForMonth(rows, d));
  const pipeline: PipelineReport = {
    mode,
    months: pipelineMonths,
    total: pipelineMonths.reduce((a, m) => a + m.total, 0),
    accounts: pipelineMonths.reduce((a, m) => a + m.accounts, 0),
    byRisk: combineByRisk(pipelineMonths),
  };

  return { asOf: monthKey(now), live, renewed, pipeline };
}

/** Live entry point used by the dashboard page. Team-walled via listRenewals. */
export async function getDashboardData(now: Date): Promise<DashboardData> {
  try {
    const rows = await listRenewals("all");
    return buildDashboardData(rows, now, true);
  } catch {
    return buildDashboardData([], now, false);
  }
}
