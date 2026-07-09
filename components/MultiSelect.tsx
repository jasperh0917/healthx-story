"use client";

import { useEffect, useRef, useState } from "react";

const ORANGE = "#fb9b35"; // WellX Energy Orange — active pill fill

// Compact multi-select filter: a single pill that opens a checkbox list.
export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  width = "w-64",
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const active = selected.length > 0;
  const toggle = (o: string) =>
    onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 rounded-full border px-4 text-sm font-medium"
        style={active ? { backgroundColor: ORANGE, color: "#0b1220", borderColor: ORANGE } : { backgroundColor: "#fff", color: "#0b1220", borderColor: "#e2e6ee" }}
      >
        {label}
        {active ? ` · ${selected.length}` : ": All"} ▾
      </button>
      {open && (
        <div className={`absolute left-0 z-50 mt-2 ${width} rounded-xl border border-[#e6e9f0] bg-white p-1 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.4)]`}>
          {options.map((o) => (
            <label key={o} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#f5f7fb]">
              <input
                type="checkbox"
                checked={selected.includes(o)}
                onChange={() => toggle(o)}
                className="h-4 w-4 accent-[#b5560a]"
              />
              {o}
            </label>
          ))}
          {active && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-lg px-3 py-1.5 text-left text-xs text-[#5b6472] hover:bg-[#f5f7fb]"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
