"use client";

import { useEffect, useState } from "react";

// A spreadsheet cell that DISPLAYS a comma-formatted number, and turns into a
// whole-number spinner input when clicked. Saves on blur if the value changed.
export default function NumberCell({
  value,
  onSave,
  align = "right",
}: {
  value: string; // raw digits, e.g. "772605"
  onSave: (next: string) => void;
  align?: "left" | "right";
}) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);

  const fmt = (raw: string) => (raw === "" ? "" : Number(raw).toLocaleString("en-US"));

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={`w-full rounded-md border border-transparent px-2 py-1 text-sm hover:border-[#e2e6ee] ${
          align === "right" ? "text-right" : "text-left"
        }`}
      >
        {v === "" ? <span className="text-[#c2c8d2]">—</span> : fmt(v)}
      </button>
    );
  }

  return (
    <input
      type="number"
      step={1}
      min={0}
      autoFocus
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (v !== value) onSave(v);
      }}
      className={`w-28 rounded-md border border-[#b5560a] bg-white px-2 py-1 text-sm outline-none ${
        align === "right" ? "text-right" : "text-left"
      }`}
    />
  );
}
