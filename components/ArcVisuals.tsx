"use client";

import { motion } from "framer-motion";
import { arc } from "@/data/portfolio";

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const EASE = [0.22, 1, 0.36, 1] as const;

/** Cumulative 24-month build-up — 2024 book as the base, renewed + new business stacked on top through 2025. */
export function GrowthChart() {
  const { monthlyGp2024, monthlyGp2025Renewal, monthlyGp2025New, y2024, y2025 } = arc;

  const runningSum = (a: number[]) => {
    let s = 0;
    return a.map((v) => (s += v));
  };
  const cum2024 = runningSum(monthlyGp2024);
  const cumRenewal = runningSum(monthlyGp2025Renewal);
  const cumNew = runningSum(monthlyGp2025New);
  const base2024 = cum2024[11];
  const grandTotal = base2024 + cumRenewal[11] + cumNew[11];
  const max = grandTotal * 1.06;

  const W = 960;
  const baseY = 264;
  const chartH = 200;
  const padL = 14;
  const yearGap = 30;
  const step = (W - padL * 2 - yearGap) / 24;
  const bw = step * 0.6;
  const x = (i: number) => padL + i * step + (i >= 12 ? yearGap : 0) + (step - bw) / 2;
  const h = (v: number) => (v / max) * chartH;

  const bar = (xPos: number, height: number, yTop: number, cls: string, delay: number, key: string) => (
    <motion.rect
      key={key}
      x={xPos}
      width={bw}
      rx={3}
      className={cls}
      initial={{ height: 0, y: baseY }}
      animate={{ height, y: yTop }}
      transition={{ delay, duration: 0.8, ease: [...EASE] }}
    />
  );

  return (
    <div className="glass p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">Gross premium written · cumulative · AED M</p>
        <div className="flex flex-wrap gap-5 font-mono text-[11px] text-slate-400">
          <Legend cls="bg-slate-500/70" label="2024 book" />
          <Legend cls="bg-emerald-400" label="2025 renewed" />
          <Legend cls="bg-cyan-400" label="2025 new business" />
        </div>
      </div>

      {/* wide chart: keep it legible on narrow screens, scroll horizontally */}
      <div className="-mx-2 overflow-x-auto px-2">
      <svg viewBox={`0 0 ${W} 318`} className="w-full min-w-[600px]">
        {/* scale gridlines */}
        {[50, 100].map((g) => (
          <g key={g}>
            <line x1={padL} x2={W - padL} y1={baseY - h(g)} y2={baseY - h(g)} className="stroke-white/[0.06]" strokeDasharray="3 5" />
            <text x={padL} y={baseY - h(g) - 5} textAnchor="start" className="fill-slate-600 font-mono text-[9px]">
              {g}M
            </text>
          </g>
        ))}

        {/* baseline */}
        <line x1={padL} x2={W - padL} y1={baseY} y2={baseY} className="stroke-white/15" />

        {/* 2024 — the book builds to 61.1M */}
        {cum2024.map((v, i) =>
          bar(x(i), h(v), baseY - h(v), "fill-slate-500/55", i * 0.03, `b24-${i}`)
        )}

        {/* 2025 — the 2024 base carries, renewed + new business stack on top */}
        {cumRenewal.map((r, i) => {
          const n = cumNew[i];
          const d = 0.36 + i * 0.03;
          return [
            bar(x(12 + i), h(base2024), baseY - h(base2024), "fill-slate-500/55", d, `b25b-${i}`),
            bar(x(12 + i), h(r), baseY - h(base2024) - h(r), "fill-emerald-400/90", d + 0.06, `b25r-${i}`),
            bar(x(12 + i), h(n), baseY - h(base2024) - h(r) - h(n), "fill-cyan-400/90", d + 0.12, `b25n-${i}`),
          ];
        })}

        {/* grand total marker */}
        <text
          x={x(23) + bw}
          y={baseY - h(grandTotal) - 8}
          textAnchor="end"
          className="fill-white font-mono text-[12px]"
        >
          {grandTotal.toFixed(1)}M · 2024–25
        </text>

        {/* month + year axis */}
        {[...MONTHS, ...MONTHS].map((m, i) => (
          <text key={i} x={x(i) + bw / 2} y={baseY + 18} textAnchor="middle" className="fill-slate-600 font-mono text-[9px]">
            {m}
          </text>
        ))}
        <text x={x(5) + bw / 2} y={baseY + 42} textAnchor="middle" className="fill-slate-400 font-mono text-[12px]">
          UY 2024 · {y2024.gp.toFixed(1)}M
        </text>
        <text x={x(17) + bw / 2} y={baseY + 42} textAnchor="middle" className="fill-emerald-300 font-mono text-[12px]">
          UY 2025 · {y2025.gp.toFixed(1)}M · +{y2025.gpGrowthPct}%
        </text>
      </svg>
      </div>

      <p className="mt-4 font-mono text-[11px] text-slate-500">
        2024 book {y2024.gp.toFixed(1)}M + 2025 renewed {y2025.renewalGp.toFixed(1)}M + new business {y2025.newGp.toFixed(1)}M · lives 9,874 → 11,201 (+{y2025.livesGrowthPct}%)
      </p>
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`inline-block h-2.5 w-2.5 rounded-sm ${cls}`} />
      {label}
    </span>
  );
}

/** UY2024 cohorts at renewal — by gross premium written, not logo count. */
export function CohortSplit() {
  const { good, bad } = arc.cohorts;
  const renewedTotal = good.gpRenewed + bad.gpKept; // performing + loss-making premium that renewed
  const pctRemovedBad = Math.round((100 * bad.gpRemoved) / bad.gpTotal);
  const pctPerformingOfRenewed = Math.round((100 * good.gpRenewed) / renewedTotal);

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <div className="glass p-7">
        <p className="eyebrow mb-6">UY 2024 book at renewal · by gross premium · AED M</p>

        <SplitRow
          label={`${good.label} · ${good.gpTotal.toFixed(1)}M · ${good.renewedGroups}/${good.groups} groups`}
          segs={[
            { n: good.gpRenewed, label: `${good.gpRenewed.toFixed(1)}M renewed`, cls: "bg-gradient-to-r from-emerald-400 to-cyan-400" },
            { n: good.gpLost, label: `${good.gpLost.toFixed(1)}M lost`, cls: "bg-white/10" },
          ]}
          scale={good.gpTotal}
          max={bad.gpTotal}
        />
        <SplitRow
          label={`${bad.label} · ${bad.gpTotal.toFixed(1)}M · ${bad.renewedGroups}/${bad.groups} kept`}
          segs={[
            { n: bad.gpRemoved, label: `${bad.gpRemoved.toFixed(1)}M removed`, cls: "bg-gradient-to-r from-rose-500 to-orange-400" },
            { n: bad.gpKept, label: `${bad.gpKept.toFixed(1)}M kept · repriced`, cls: "bg-white/10" },
          ]}
          scale={bad.gpTotal}
          max={bad.gpTotal}
        />

        <p className="mt-5 font-mono text-[11px] text-slate-500">
          performing = paid NLR ≤ 100% at the UY 2024 snapshot · premium = UY 2024 gross written ·
          groups consolidated across name variants · renewal matched across UY 2024 → 2025
        </p>
      </div>

      <div className="grid gap-4">
        <div className="glass glow-emerald p-6">
          <div className="font-display text-4xl font-semibold text-emerald-300">{pctRemovedBad}%</div>
          <p className="mt-2 text-sm text-slate-400">
            of loss-making premium <strong className="text-white">removed</strong> at renewal —
            AED {bad.gpRemoved.toFixed(1)}M of {bad.gpTotal.toFixed(1)}M
          </p>
        </div>
        <div className="glass p-6">
          <div className="font-display text-4xl font-semibold text-cyan-300">{pctPerformingOfRenewed}%</div>
          <p className="mt-2 text-sm text-slate-400">
            of the renewed book is <strong className="text-white">performing premium</strong> —
            AED {good.gpRenewed.toFixed(1)}M of {renewedTotal.toFixed(1)}M
          </p>
        </div>
      </div>
    </div>
  );
}

function SplitRow({
  label,
  segs,
  scale,
  max,
}: {
  label: string;
  segs: { n: number; label: string; cls: string }[];
  scale: number;
  max: number;
}) {
  return (
    <div className="mb-6 last:mb-0">
      <p className="mb-2 text-[13px] text-slate-400">{label}</p>
      <div className="flex h-9 gap-1" style={{ width: `${(100 * scale) / max}%` }}>
        {segs.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ flexGrow: 0.0001, opacity: 0 }}
            animate={{ flexGrow: s.n, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.15, duration: 0.9, ease: [...EASE] }}
            className={`flex min-w-0 items-center overflow-hidden rounded-md px-3 ${s.cls}`}
          >
            <span className="truncate font-mono text-[11px] text-white/90 [text-shadow:0_0_8px_rgba(0,0,0,0.45)]">
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
