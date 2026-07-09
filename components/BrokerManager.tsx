"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Broker } from "@/lib/brokers";
import { setBrokerDisplay } from "@/lib/brokers-actions";

const PURPLE = "#b43082"; // this section's button colour (white text)

export default function BrokerManager({ brokers }: { brokers: Broker[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return brokers.filter(
      (b) => !q || b.display.toLowerCase().includes(q) || b.raw_broker.toLowerCase().includes(q),
    );
  }, [brokers, search]);

  const run = (fn: () => Promise<void>) => {
    setErr(null);
    start(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };
  const save = (b: Broker, value: string) => {
    if (value === b.display) return;
    run(() => setBrokerDisplay(b.raw_broker, value));
  };
  const reset = (b: Broker) => {
    setNames((p) => { const n = new Map(p); n.delete(b.raw_broker); return n; });
    run(() => setBrokerDisplay(b.raw_broker, ""));
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search a broker…"
          className="h-9 w-72 rounded-full border border-[#e2e6ee] px-4 text-sm outline-none focus:border-[#003780]"
        />
        <span className="text-xs text-[#9aa2b1]">{visible.length} brokers</span>
      </div>

      {err && <p className="mt-3 text-sm" style={{ color: PURPLE }}>{err}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-[#eceff4]">
        {visible.map((b) => (
          <div key={b.raw_broker} className="flex flex-wrap items-center gap-3 border-b border-[#f4f6fa] px-4 py-2.5 last:border-0 hover:bg-[#fafbfd]">
            <input
              value={names.get(b.raw_broker) ?? b.display}
              onChange={(e) => setNames((p) => new Map(p).set(b.raw_broker, e.target.value))}
              onBlur={(e) => save(b, e.target.value)}
              className="min-w-[200px] flex-1 rounded-md border border-transparent px-2 py-1 text-sm font-medium outline-none hover:border-[#e2e6ee] focus:border-[#003780]"
              disabled={pending}
              title="Display name — edit to rename"
            />
            <span className="max-w-[320px] truncate text-xs text-[#9aa2b1]" title={b.raw_broker}>{b.raw_broker}</span>
            <span className="text-xs text-[#5b6472]">{b.policies} {b.policies === 1 ? "policy" : "policies"}</span>
            {b.override && (
              <button
                onClick={() => reset(b)}
                disabled={pending}
                className="rounded-full px-3 py-1 text-xs font-semibold disabled:opacity-40"
                style={{ backgroundColor: PURPLE, color: "#fff" }}
              >
                Reset
              </button>
            )}
          </div>
        ))}
        {visible.length === 0 && <p className="py-10 text-center text-sm text-[#9aa2b1]">No brokers match.</p>}
      </div>
    </div>
  );
}
