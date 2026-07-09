// Headline portfolio numbers for Jasper's home screen — computed LIVE from the
// TRR spine (public.jasper_renewals_live) through the signed-in staff session.
import { createClient } from "@/lib/supabase/server";

export type PortfolioSummary = {
  groups: number;
  grossPremium: number; // AED — sum of each group's latest-UY gross premium
  netPremium: number; // AED — sum of net premium (the NLR base)
  blendedNlr: number; // premium-weighted incurred NLR, e.g. 0.98 = 98%
  hotGroups: number; // groups running over 100% NLR
  expiringSoon: number; // groups expiring within 60 days
  live: boolean; // false if the DB read failed (never fabricates numbers)
};

const EMPTY: PortfolioSummary = {
  groups: 0,
  grossPremium: 0,
  netPremium: 0,
  blendedNlr: 0,
  hotGroups: 0,
  expiringSoon: 0,
  live: false,
};

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  try {
    const supabase = await createClient();
    // Scope the headline to the CURRENT in-force book (policy not yet expired).
    // Groups whose latest policy already lapsed are churned/pending-renewal and
    // belong in the renewal tracker's chase list, not the portfolio headline.
    const { data, error } = await supabase
      .from("jasper_renewals_live")
      .select("gross_premium, net_premium, live_nlr, days_to_expiry")
      .gte("days_to_expiry", 0);

    if (error || !data) return EMPTY;

    let grossPremium = 0;
    let netPremium = 0;
    let weighted = 0;
    let hotGroups = 0;
    let expiringSoon = 0;

    for (const r of data as Array<Record<string, unknown>>) {
      const gross = Number(r.gross_premium) || 0;
      const net = Number(r.net_premium) || 0;
      const nlr = Number(r.live_nlr) || 0;
      const days = Number(r.days_to_expiry);

      grossPremium += gross;
      netPremium += net;
      weighted += net * nlr; // weight the loss ratio by premium
      if (nlr > 1) hotGroups += 1;
      if (Number.isFinite(days) && days >= 0 && days <= 60) expiringSoon += 1;
    }

    return {
      groups: data.length,
      grossPremium,
      netPremium,
      blendedNlr: netPremium > 0 ? weighted / netPremium : 0,
      hotGroups,
      expiringSoon,
      live: true,
    };
  } catch {
    return EMPTY;
  }
}
