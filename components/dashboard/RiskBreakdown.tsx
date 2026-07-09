"use client";

// A reusable risk-breakdown panel: the 4 risk bands as labelled bars with
// premium + group count. Used inside the Card 1 modal (with retention +
// clickthrough) and the Card 2 pipeline modal (plain).
import { RISK_META, type RiskTier } from "@/lib/risk";
import { pctRenewed, type RiskBucket } from "@/lib/dashboard-shared";
import { aedShort, ratioPct } from "@/components/dashboard/format";

export default function RiskBreakdown({
  buckets,
  showRetention = false,
  onTierClick,
}: {
  buckets: RiskBucket[];
  showRetention?: boolean;
  // When set, each band's amount becomes a clickthrough (Card 1 → tracker).
  onTierClick?: (tier: RiskTier) => void;
}) {
  const max = Math.max(1, ...buckets.map((b) => b.premium));

  return (
    <div className="flex flex-col gap-4">
      {showRetention && (
        <p className="rounded-lg bg-[#f7f9fc] px-3 py-2 text-[11px] leading-relaxed text-[#5b6472]">
          <span className="font-semibold text-[#0b1220]">% renewed</span> = renewed premium ÷ last year&apos;s
          premium of all policies that were up for renewal. Over 100% means we renewed the whole band at a
          higher rate.
        </p>
      )}
      {buckets.map((b) => {
        const meta = RISK_META[b.tier];
        const retention = showRetention ? pctRenewed(b.premium, b.bookBase) : null;
        // Clickable whenever the band had policies up for renewal — the drill-down
        // shows the whole bucket, including the non-renewed.
        const clickable = !!onTierClick && b.bookBase > 0;
        return (
          <div key={b.tier}>
            <div className="flex items-baseline justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
                <span className="text-sm font-semibold text-[#0b1220]">{b.tier}</span>
                <span className="text-[11px] text-[#9aa2b1]">{meta.band}</span>
              </div>
              {clickable ? (
                <button
                  type="button"
                  onClick={() => onTierClick!(b.tier)}
                  title={`Open all ${b.tier} policies up for renewal in the tracker`}
                  className="group inline-flex items-center gap-1 text-sm font-semibold text-[#b5560a] transition-colors hover:text-[#8a3f06]"
                >
                  <span className="underline decoration-[#f3c58f] underline-offset-2 group-hover:decoration-[#b5560a]">
                    {aedShort(b.premium)}
                  </span>
                  <span aria-hidden className="text-xs transition-transform group-hover:translate-x-0.5">→</span>
                </button>
              ) : (
                <span className="text-sm font-semibold text-[#0b1220]">{aedShort(b.premium)}</span>
              )}
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#f1f3f8]">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(b.premium / max) * 100}%`, backgroundColor: meta.color }}
              />
            </div>
            <p className="mt-1 flex items-center justify-between gap-2 text-[11px] text-[#9aa2b1]">
              <span>
                {showRetention
                  ? `${b.groups} of ${b.bookGroups} ${b.bookGroups === 1 ? "group" : "groups"} renewed`
                  : `${b.groups} ${b.groups === 1 ? "group" : "groups"}`}{" "}
                · {meta.blurb}
              </span>
              {showRetention && (
                <span className="shrink-0">
                  <span
                    className="font-semibold"
                    style={{ color: retention != null && retention >= 0.8 ? "#1a7a44" : "#b0451f" }}
                  >
                    {ratioPct(retention)} renewed
                  </span>
                  {b.bookBase > 0 && (
                    <span className="ml-1 font-normal text-[#b6bdc9]">
                      · {aedShort(b.premium)} of {aedShort(b.bookBase)} prior-yr
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
