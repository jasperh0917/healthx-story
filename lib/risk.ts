// ─────────────────────────────────────────────────────────────────────────────
// Risk classification (Renewal Dashboard).
//
// This is a DISTINCT model from lib/nlr.ts. nlr.ts holds the 6-tier commercial
// grading used by the tracker's filter ("Highly Profitable" … "Heavily Loss-
// making"). This file holds the coarser 4-tier *risk* view the dashboard groups
// premium by. Keep them separate on purpose — they answer different questions.
//
// Bands (contiguous; the "91 / 101" in the brief is just human labelling):
//   Low Risk       NLR  < 90%
//   Moderate Risk  NLR  90–100%
//   Elevated Risk  NLR  100–120%
//   High Risk      NLR  > 120%
// ─────────────────────────────────────────────────────────────────────────────

export const RISK_TIERS = ["Low Risk", "Moderate Risk", "Elevated Risk", "High Risk"] as const;

export type RiskTier = (typeof RISK_TIERS)[number];

/** Classify a net loss ratio (0.98 = 98%) into a risk tier. */
export function riskTier(nlr: number | null | undefined): RiskTier | null {
  if (nlr == null || Number.isNaN(nlr)) return null;
  if (nlr < 0.9) return "Low Risk";
  if (nlr <= 1.0) return "Moderate Risk";
  if (nlr <= 1.2) return "Elevated Risk";
  return "High Risk";
}

/** Display metadata per tier — colour + the human-readable band. */
export const RISK_META: Record<RiskTier, { color: string; band: string; blurb: string }> = {
  "Low Risk": { color: "#1a7a44", band: "NLR under 90%", blurb: "Comfortably profitable" },
  "Moderate Risk": { color: "#e0a100", band: "NLR 90–100%", blurb: "Watchful — near breakeven" },
  "Elevated Risk": { color: "#d9820b", band: "NLR 100–120%", blurb: "Loss-making — needs a rate story" },
  "High Risk": { color: "#f1517b", band: "NLR over 120%", blurb: "Heavy loss — action required" },
};
