// ─────────────────────────────────────────────────────────────────────────────
// Renewal Dashboard — SHARED types + pure helpers.
//
// This module has NO server-only imports (no next/headers, no supabase/server),
// so it is safe to import from both the server data layer (lib/dashboard-data.ts)
// AND "use client" components. Keep it that way — the moment this file reaches a
// server-only module, importing it into a client component breaks the page.
// ─────────────────────────────────────────────────────────────────────────────
import type { RiskTier } from "@/lib/risk";

/** One risk band's slice of a premium total. */
export type RiskBucket = {
  tier: RiskTier;
  premium: number; // AED — renewed booked (Card 1) or in-progress (Card 2) premium
  bookBase: number; // AED — prior-year gross of ALL policies up for renewal in the bucket (0 for pipeline)
  groups: number; // # of renewed master contracts in this band
  bookGroups: number; // # of ALL master contracts up for renewal in the band (all statuses; 0 for pipeline)
};

/**
 * % Renewed = renewed booked premium ÷ prior-year premium of ALL policies that
 * were up for renewal in the bucket. This is the numerator the user reads off
 * the card (the premium actually booked), over the whole expiring book.
 * Can exceed 100% only when a bucket is (near) fully renewed at higher rates —
 * i.e. genuine growth, not double-counting. null when nothing was up.
 */
export function pctRenewed(renewedPremium: number, bookBase: number): number | null {
  return bookBase > 0 ? renewedPremium / bookBase : null;
}

/** A single month's renewed premium, with its risk breakdown. */
export type MonthPremium = {
  monthKey: string; // "2026-07" — stable key for queries / URLs
  monthLabel: string; // "July 2026" — matches the tracker's Month filter labels
  total: number; // AED — sum of renewed gross premium (the new premium booked)
  bookBase: number; // AED — prior-year gross of ALL policies up for renewal this month (denominator)
  groups: number; // # of renewed master contracts
  byRisk: RiskBucket[]; // always length 4, ordered like RISK_TIERS
};

/** Card 1 payload: current vs last month renewed premium. */
export type RenewedPremiumMetrics = {
  current: MonthPremium;
  last: MonthPremium;
};

/** One month inside the pipeline (in-progress renewals not yet closed). */
export type PipelineMonth = {
  monthKey: string;
  monthLabel: string;
  total: number; // AED — value of in-progress renewals landing this month
  accounts: number; // # of in-progress master contracts
  byRisk: RiskBucket[];
};

/** Card 2 payload: pipeline over the two conditional target months. */
export type PipelineReport = {
  // "early" = day 1–15 → [current, last]; "late" = day 16+ → [current, next]
  mode: "early" | "late";
  months: PipelineMonth[]; // exactly the two target months
  total: number; // AED — combined pipeline value
  accounts: number; // combined in-progress count
  byRisk: RiskBucket[]; // combined risk breakdown across both months
};

export type DashboardData = {
  asOf: string; // ISO month the numbers reflect
  live: boolean; // false if the DB read failed (never fabricates numbers)
  renewed: RenewedPremiumMetrics;
  pipeline: PipelineReport;
};
