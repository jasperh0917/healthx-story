"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bars } from "./Story";
import { census } from "@/data/portfolio";

const SLICES = [
  { key: "all", label: "All members", note: "distinct members across the full claims history" },
  { key: "active", label: "Active members", note: "lives in force at the Jun 2026 snapshot (TRR)" },
] as const;

export default function CensusExplorer() {
  const [slice, setSlice] = useState<(typeof SLICES)[number]["key"]>("all");
  const d = census[slice];
  const note = SLICES.find((s) => s.key === slice)!.note;

  return (
    <div className="mt-12">
      <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex gap-2">
          {SLICES.map((s) => (
            <motion.button
              key={s.key}
              whileTap={{ scale: 0.94 }}
              onClick={() => setSlice(s.key)}
              className={`rounded-full border px-4 py-1.5 font-mono text-xs transition-colors ${
                slice === s.key
                  ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 text-slate-500 hover:text-slate-300"
              }`}
            >
              {s.label}
            </motion.button>
          ))}
        </div>
        <p className="font-mono text-xs text-slate-500">
          <span className="text-slate-200">{d.total.toLocaleString()}</span> members · {note}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass p-7">
          <p className="eyebrow mb-5">Gender</p>
          <Bars
            items={d.gender.map((g) => ({
              label: g.label,
              value: g.value,
              display: `${g.value.toLocaleString()} · ${g.pct}%`,
            }))}
          />
          <p className="eyebrow mb-5 mt-8">Relation</p>
          <Bars
            items={d.relation.map((g) => ({
              label: g.label,
              value: g.value,
              display: `${g.value.toLocaleString()} · ${g.pct}%`,
            }))}
          />
        </div>
        <div className="glass p-7 lg:col-span-2">
          <p className="eyebrow mb-5">Age brackets</p>
          <Bars
            items={d.age.map((g) => ({
              label: g.label,
              value: g.value,
              display: `${g.value.toLocaleString()} · ${g.pct}%`,
            }))}
          />
          <p className="eyebrow mb-5 mt-8">Nationality groups</p>
          <Bars
            items={d.nationality.map((g) => ({
              label: g.label,
              value: g.value,
              display: `${g.value.toLocaleString()} · ${g.pct}%`,
            }))}
            color="from-emerald-400 to-cyan-400"
          />
          <p className="mt-4 font-mono text-[11px] text-slate-500">
            {slice === "active"
              ? "active headcount from the premium register (in-force lives); demographic mix estimated from active members who have claimed"
              : "basis: distinct members in the claims feed — members who never claimed are not visible until the enrolment feed lands"}
          </p>
        </div>
      </div>
    </div>
  );
}
