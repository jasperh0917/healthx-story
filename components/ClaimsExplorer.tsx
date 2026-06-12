"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bars } from "./Story";
import { claimsStory, diagnosisByNetwork, groupHints, networks } from "@/data/portfolio";

const ALL = networks.map((n) => n[0]);

// Value IP and VN dental roll up into Value
const ROLLUP: Record<string, string> = { VIP: "VN", VD: "VN" };
const norm = (net: string) => ROLLUP[net] ?? net;

export default function ClaimsExplorer() {
  const [sel, setSel] = useState<Set<string>>(new Set(ALL));
  const [toast, setToast] = useState<string | null>(null);
  const allOn = sel.size === ALL.length;

  // Selecting a network from the "all" state starts a fresh selection of just
  // that network; otherwise chips toggle. Emptying the selection resets to all.
  const toggle = (code: string) => {
    setSel((prev) => {
      if (code === "all") return new Set(ALL);
      if (prev.size === ALL.length) return new Set([code]);
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next.size === 0 ? new Set(ALL) : next;
    });
  };

  const sum = (rows: [string, string, number][]) => {
    const m = new Map<string, number>();
    rows.forEach(([net, label, v]) => {
      if (sel.has(norm(net))) m.set(label, (m.get(label) ?? 0) + v);
    });
    return [...m.entries()].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  };

  const fob = useMemo(() => sum(claimsStory.fobByNetwork), [sel]);
  const relation = useMemo(() => sum(claimsStory.relationByNetwork), [sel]);
  const diagnosis = useMemo(() => sum(diagnosisByNetwork), [sel]);

  const providers = useMemo(() => {
    const m = new Map<string, { aed: number; episodes: number }>();
    claimsStory.providersByNetwork.forEach(([net, pg, aed, ep]) => {
      if (!sel.has(norm(net))) return;
      const cur = m.get(pg) ?? { aed: 0, episodes: 0 };
      m.set(pg, { aed: cur.aed + aed, episodes: cur.episodes + ep });
    });
    return [...m.entries()]
      .map(([label, v]) => ({ label, ...v, perEp: v.episodes ? v.aed / v.episodes : 0 }))
      .filter((p) => p.aed > 0)
      .sort((a, b) => b.aed - a.aed);
  }, [sel]);

  const fobTotal = fob.reduce((s, [, v]) => s + v, 0);
  const relTotal = relation.reduce((s, [, v]) => s + v, 0);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  };

  return (
    <div className="mt-12">
      {/* slicer — pinned while the claims story scrolls */}
      <div className="glass sticky top-3 z-30 mb-6 flex flex-wrap items-center gap-2 px-4 py-3">
        <Chip label="All networks" on={allOn} onClick={() => toggle("all")} />
        {networks.map(([code, name]) => (
          <Chip key={code} label={name} on={!allOn && sel.has(code)} onClick={() => toggle(code)} />
        ))}
        <span className="ml-auto hidden font-mono text-[11px] text-slate-500 sm:block">
          filters every chart below
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass p-7">
          <p className="eyebrow mb-5">Claims by benefit · predictable</p>
          <Bars
            items={fob.slice(0, 7).map(([label, v]) => ({
              label,
              value: v,
              display: `${(v / 1e6).toFixed(1)}M · ${((100 * v) / fobTotal).toFixed(1)}%`,
            }))}
            color="from-violet-400 to-rose-400"
          />
          <p className="mt-4 font-mono text-[11px] text-slate-500">
            out-patient takes two of every three dirhams, on every network
          </p>
        </div>

        <div className="glass p-7">
          <p className="eyebrow mb-5">Claims by relation · mirrors the census</p>
          <Bars
            items={relation.map(([label, v]) => ({
              label,
              value: v,
              display: `${(v / 1e6).toFixed(1)}M · ${((100 * v) / relTotal).toFixed(0)}% vs ${
                claimsStory.censusRelationPct[label] ?? 0
              }% of members`,
            }))}
            color="from-violet-400 to-rose-400"
          />
          <p className="mt-4 font-mono text-[11px] text-slate-500">
            claims share tracks member share — no relation over-consumes wildly
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="glass p-7 lg:col-span-2">
          <p className="eyebrow mb-5">Top provider groups · AED & per episode</p>
          <Bars
            items={providers.slice(0, 10).map((p) => ({
              label: p.label,
              value: p.aed,
              display: `${(p.aed / 1e6).toFixed(1)}M · ${Math.round(p.perEp).toLocaleString()}/ep`,
            }))}
            color="from-violet-400 to-rose-400"
          />
          <p className="mt-4 font-mono text-[11px] text-slate-500">
            consolidated groups · independent clinics excluded · /ep = payer share per care episode
          </p>
        </div>

        <div className="glass glow-violet p-7 lg:col-span-3">
          <p className="eyebrow mb-5">Volume vs cost per episode</p>
          <Scatter pts={providers.filter((p) => p.episodes >= 25)} />
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-slate-500">
            top 5 by cost per episode —{" "}
            {[...providers]
              .filter((p) => p.episodes >= 25)
              .sort((a, b) => b.perEp - a.perEp)
              .slice(0, 5)
              .map((p, i) => (
                <span key={p.label}>
                  {i > 0 && " · "}
                  <span className="text-slate-300">{p.label.replace(" Group", "")}</span>{" "}
                  {Math.round(p.perEp).toLocaleString()}/ep × {(p.episodes / 1000).toFixed(1)}k episodes
                </span>
              ))}
          </p>
        </div>
      </div>

      <div className="glass mt-4 p-7">
        <p className="eyebrow mb-5">What the spend treats · 16 diagnosis groups</p>
        <Bars
          items={diagnosis.map(([label, v]) => ({
            label,
            value: v,
            display: `${(v / 1e6).toFixed(1)}M`,
            hint: groupHints[label],
          }))}
          color="from-violet-400 to-rose-400"
          onPick={(i) => showToast(i.hint ?? i.label)}
        />
        <p className="mt-4 font-mono text-[11px] text-slate-500">
          tap a group for what&apos;s inside · chemo &amp; deliveries reclassified out of Z-code
          &ldquo;wellness&rdquo; into Oncology &amp; Maternity · lifestyle &amp; metabolic still top the table
        </p>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass glow-cyan fixed bottom-8 left-1/2 z-50 -translate-x-1/2 px-6 py-3 text-sm text-slate-100"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
        on
          ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
          : "border-white/10 text-slate-500 hover:text-slate-300"
      }`}
    >
      {label}
    </motion.button>
  );
}

/** Two-variable view: episode volume (x) vs payer share per episode (y), bubble = total spend. */
function Scatter({ pts }: { pts: { label: string; aed: number; episodes: number; perEp: number }[] }) {
  if (!pts.length) {
    return <p className="py-16 text-center text-sm text-slate-500">no provider volume on this selection</p>;
  }

  const W = 920, H = 400, padL = 64, padR = 30, padT = 16, padB = 48;
  const nice = (v: number) => Math.ceil(v / 500) * 500;
  const mx = Math.max(...pts.map((p) => p.episodes)) * 1.12;
  const my = nice(Math.max(...pts.map((p) => p.perEp)) * 1.15);
  const maxAed = Math.max(...pts.map((p) => p.aed));
  const x = (ep: number) => padL + (ep / mx) * (W - padL - padR);
  const y = (v: number) => H - padB - (v / my) * (H - padB - padT);
  const r = (aed: number) => 7 + 20 * Math.sqrt(aed / maxAed);

  const xStep = Math.max(100, Math.ceil(mx / 4 / 100) * 100);
  const xTicks = [1, 2, 3, 4].map((i) => i * xStep).filter((t) => t <= mx);
  const yTicks = [0.25, 0.5, 0.75, 1].map((f) => my * f);

  return (
    <div className="-mx-2 overflow-x-auto px-2">
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]">
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="stroke-white/[0.06]" strokeDasharray="3 5" />
          <text x={padL - 8} y={y(t) + 3} textAnchor="end" className="fill-slate-600 font-mono text-[10px]">
            {Math.round(t).toLocaleString()}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <text key={`x${t}`} x={x(t)} y={H - padB + 18} textAnchor="middle" className="fill-slate-600 font-mono text-[10px]">
          {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}
        </text>
      ))}
      <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} className="stroke-white/15" />
      <line x1={padL} x2={padL} y1={padT} y2={H - padB} className="stroke-white/15" />
      <text x={(padL + W - padR) / 2} y={H - 8} textAnchor="middle" className="fill-slate-500 font-mono text-[10px]">
        care episodes
      </text>
      <text x={14} y={(padT + H - padB) / 2} textAnchor="middle" transform={`rotate(-90 14 ${(padT + H - padB) / 2})`} className="fill-slate-500 font-mono text-[10px]">
        AED / episode
      </text>

      {pts.map((p) => {
        const hot = p.label === "Mediclinic Group";
        return (
          <g key={p.label}>
            <motion.circle
              initial={false}
              animate={{ cx: x(p.episodes), cy: y(p.perEp), r: r(p.aed) }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className={hot ? "fill-rose-400/70 stroke-rose-300" : "fill-cyan-400/40 stroke-cyan-300/60"}
              strokeWidth={1}
            />
            <motion.text
              initial={false}
              animate={{ x: x(p.episodes) + r(p.aed) + 6, y: y(p.perEp) + 3 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className={`font-mono text-[10px] ${hot ? "fill-rose-200" : "fill-slate-400"}`}
            >
              {p.label.replace(" Group", "").replace(" Healthcare", "")}
            </motion.text>
          </g>
        );
      })}
    </svg>
    </div>
  );
}
