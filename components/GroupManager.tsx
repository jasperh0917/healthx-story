"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PolicyGroup } from "@/lib/groups";
import { combinePolicies, splitPolicies, revertPolicies, setPolicyDisplay } from "@/lib/groups-actions";

const PINK = "#f1517b"; // this section's button colour (black text)
const GREEN = "#1a7a44";

type Filter = "combined" | "overridden" | "all";

const pct = (n: number | null) => (n == null ? "—" : `${(n * 100).toFixed(0)}%`);
const money = (n: number | null) => (n == null ? "—" : Math.round(n).toLocaleString("en-US"));

export default function GroupManager({ groups }: { groups: PolicyGroup[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map()); // master_key -> edited display

  const premiumByClient = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of groups) for (const mem of g.members) m.set(mem.client, mem.net_premium ?? 0);
    return m;
  }, [groups]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter((g) => {
      if (filter === "combined" && g.sub_policies < 2) return false;
      if (filter === "overridden" && !g.is_overridden && !g.display_override) return false;
      if (!q) return true;
      return g.display.toLowerCase().includes(q) || g.members.some((m) => m.client.toLowerCase().includes(q));
    });
  }, [groups, filter, search]);

  const toggle = (client: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(client) ? n.delete(client) : n.add(client);
      return n;
    });
  const toggleGroup = (g: PolicyGroup) =>
    setSelected((prev) => {
      const n = new Set(prev);
      const all = g.members.every((m) => n.has(m.client));
      for (const m of g.members) (all ? n.delete(m.client) : n.add(m.client));
      return n;
    });

  const run = (fn: () => Promise<void>) => {
    setErr(null);
    startTransition(async () => {
      try {
        await fn();
        setSelected(new Set());
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  const saveName = (g: PolicyGroup, value: string) => {
    if (!g.renewal_id || value === g.display) return;
    run(() => setPolicyDisplay(g.renewal_id!, value));
  };

  const sel = [...selected];
  const doCombine = () => {
    if (sel.length < 2) return;
    const anchor = sel.reduce((a, b) => ((premiumByClient.get(b) ?? 0) > (premiumByClient.get(a) ?? 0) ? b : a));
    run(() => combinePolicies(sel, anchor));
  };

  const pinkBtn = { backgroundColor: PINK, color: "#000" } as const;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a company or policy…"
          className="h-9 w-72 rounded-full border border-[#e2e6ee] px-4 text-sm outline-none focus:border-[#003780]"
        />
        <div className="flex gap-1 rounded-full border border-[#eceff4] p-1">
          {(["all", "combined", "overridden"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors"
              style={filter === f ? { backgroundColor: PINK, color: "#000" } : { color: "#5b6472" }}
            >
              {f === "combined" ? "Combined (2+)" : f}
            </button>
          ))}
        </div>
        <span className="text-xs text-[#9aa2b1]">{visible.length} policies</span>
      </div>

      {err && <p className="mt-3 text-sm" style={{ color: PINK }}>{err}</p>}

      <div className="mt-5 space-y-3 pb-28">
        {visible.map((g) => {
          const allSel = g.members.every((m) => selected.has(m.client));
          const someSel = !allSel && g.members.some((m) => selected.has(m.client));
          const hot = (g.blended_nlr ?? 0) > 1;
          const nameVal = names.get(g.master_key) ?? g.display;
          return (
            <div key={g.master_key} className="rounded-2xl border border-[#eceff4]">
              <div className="flex flex-wrap items-center gap-3 border-b border-[#f4f6fa] px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSel}
                  ref={(el) => { if (el) el.indeterminate = someSel; }}
                  onChange={() => toggleGroup(g)}
                  className="h-4 w-4 accent-[#003780]"
                />
                <input
                  value={nameVal}
                  onChange={(e) => setNames((p) => new Map(p).set(g.master_key, e.target.value))}
                  onBlur={(e) => saveName(g, e.target.value)}
                  className="min-w-[220px] flex-1 rounded-md border border-transparent px-2 py-1 text-sm font-semibold outline-none hover:border-[#e2e6ee] focus:border-[#003780]"
                  title="Display name — edit to rename"
                />
                {g.sub_policies > 1 && (
                  <span className="rounded-full bg-[#eef2f9] px-2 py-0.5 text-[11px] font-medium text-[#40506b]">{g.sub_policies} policies</span>
                )}
                {(g.is_overridden || g.display_override) && (
                  <span className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: "#fdeef2", color: "#c02a54" }}>overridden</span>
                )}
                <span className="ml-auto flex items-center gap-4 text-sm">
                  <span className="text-[#9aa2b1]">{g.product_line ?? ""}</span>
                  <span style={{ color: hot ? PINK : GREEN }} className="font-semibold">NLR {pct(g.blended_nlr)}</span>
                  <span className="text-[#5b6472]">AED {money(g.total_net)}</span>
                </span>
              </div>
              <ul>
                {g.members.map((m) => (
                  <li key={m.client} className="flex flex-wrap items-center gap-3 px-4 py-2 text-sm hover:bg-[#fafbfd]">
                    <input
                      type="checkbox"
                      checked={selected.has(m.client)}
                      onChange={() => toggle(m.client)}
                      className="h-4 w-4 accent-[#003780]"
                    />
                    <span className="text-[#0b1220]">{m.client}</span>
                    <span className="ml-auto flex items-center gap-4 text-xs text-[#9aa2b1]">
                      <span>NLR {pct(m.nlr_net)}</span>
                      <span>AED {money(m.net_premium)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {visible.length === 0 && <p className="py-10 text-center text-sm text-[#9aa2b1]">No policies match.</p>}
      </div>

      {sel.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e6e9f0] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-3 px-6 py-3">
            <span className="text-sm font-medium">{sel.length} selected</span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button onClick={doCombine} disabled={sel.length < 2 || pending} className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40" style={pinkBtn}>
                {pending ? "Working…" : "Combine into one"}
              </button>
              <button onClick={() => run(() => splitPolicies(sel))} disabled={pending} className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40" style={pinkBtn}>
                Split out
              </button>
              <button onClick={() => run(() => revertPolicies(sel))} disabled={pending} className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-40" style={pinkBtn}>
                Revert to auto
              </button>
              <button onClick={() => setSelected(new Set())} disabled={pending} className="rounded-full px-4 py-2 text-sm text-[#9aa2b1] disabled:opacity-40">
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
