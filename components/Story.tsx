"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  lede,
  children,
  accent = "cyan",
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  children?: ReactNode;
  accent?: "cyan" | "violet" | "coral" | "emerald";
}) {
  const accentText = {
    cyan: "text-cyan-300/80",
    violet: "text-violet-300/80",
    coral: "text-rose-300/80",
    emerald: "text-emerald-300/80",
  }[accent];

  return (
    <section id={id} className="relative mx-auto max-w-6xl px-6 py-28 md:py-36">
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-12% 0px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className={`eyebrow mb-5 ${accentText}`}>{eyebrow}</p>
        <h2 className="font-display max-w-3xl text-[clamp(1.8rem,4vw,3rem)] font-semibold leading-tight text-white">
          {title}
        </h2>
        {lede && <p className="mt-5 max-w-2xl text-slate-400">{lede}</p>}
      </motion.div>
      {children}
    </section>
  );
}

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export type BarItem = { label: string; value: number; display: string; hint?: string };

export function Bars({
  items,
  color = "from-cyan-400 to-violet-500",
  onPick,
}: {
  items: BarItem[];
  color?: string;
  onPick?: (item: BarItem) => void;
}) {
  const max = Math.max(...items.map((i) => i.value));
  return (
    <div>
      {items.map((i, idx) => (
        <motion.div
          key={i.label}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ delay: idx * 0.04, duration: 0.5 }}
          onClick={onPick ? () => onPick(i) : undefined}
          whileHover={onPick ? { x: 4 } : undefined}
          className={`mb-3 flex items-center gap-3 text-[13px] ${
            onPick ? "cursor-pointer" : ""
          }`}
        >
          <span className="w-40 shrink-0 truncate text-slate-400" title={i.label}>
            {i.label}
          </span>
          <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
            <motion.span
              initial={{ width: 0 }}
              whileInView={{ width: `${(100 * i.value) / max}%` }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ delay: 0.15 + idx * 0.04, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color}`}
            />
          </span>
          <span className="w-32 shrink-0 text-right font-mono text-xs text-slate-300">
            {i.display}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
