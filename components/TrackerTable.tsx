"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { TrackerRow } from "@/lib/renewals";
import { patchRenewal } from "@/lib/renewals-actions";
import NumberCell from "@/components/NumberCell";
import MultiSelect from "@/components/MultiSelect";
import { NLR_TIERS, nlrTier } from "@/lib/nlr";
import { riskTier, RISK_META } from "@/lib/risk";

const ORANGE = "#fb9b35"; // WellX Energy Orange — fills
const ORANGE_INK = "#b5560a"; // deeper orange — readable text / links
const PINK = "#f1517b";
const GREEN = "#1a7a44";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const STATUS_OPTIONS = ["In Progress", "Lost", "Renewed"];

function nlrPct(n: number | null) {
  return n == null ? "—" : `${(n * 100).toFixed(0)}%`;
}
function fmtDate(d: string | null) {
  return d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
    : "—";
}
function rel(days: number | null) {
  if (days == null) return "";
  if (days === 0) return "today";
  return days > 0 ? `in ${days}d` : `${-days}d ago`;
}
function daysBefore(sent: string | null, expiry: string | null): number | null {
  if (!sent || !expiry) return null;
  return Math.round((new Date(expiry + "T00:00:00").getTime() - new Date(sent + "T00:00:00").getTime()) / 864e5);
}
// Group by the UPCOMING start date = the day after expiry.
function periodOf(r: TrackerRow): string | null {
  if (!r.expiry_date) return null;
  const d = new Date(r.expiry_date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function statusClass(status: string) {
  const key = status === "Renewed" ? "renewed" : status === "Lost" ? "lost" : "inprogress";
  return `jstatus jstatus-${key} rounded-md px-2 py-1 text-sm font-medium`;
}

type SaveState = "saving" | "saved" | "error";

export default function TrackerTable({
  rows,
  underwriters,
  defaultPeriod,
  defaultUnderwriter,
  initialStatus = [],
  initialRisk,
}: {
  rows: TrackerRow[];
  underwriters: string[];
  defaultPeriod: string;
  defaultUnderwriter: string;
  initialStatus?: string[];
  initialRisk?: string;
}) {
  const [month, setMonth] = useState(defaultPeriod);
  const [statusSel, setStatusSel] = useState<string[]>(initialStatus);
  const [riskFilter, setRiskFilter] = useState<string | undefined>(initialRisk);
  const [nlrSel, setNlrSel] = useState<string[]>([]);
  const [underwriter, setUnderwriter] = useState(defaultUnderwriter);
  const [search, setSearch] = useState("");

  const [edited, setEdited] = useState<Map<string, Partial<TrackerRow>>>(new Map());
  const [saveState, setSaveState] = useState<Map<string, SaveState>>(new Map());

  const periods = useMemo(() => {
    const m = new Map<string, { label: string; y: number; m: number }>();
    const add = (label: string, y: number, mi: number) => { if (!m.has(label)) m.set(label, { label, y, m: mi }); };
    for (const r of rows) {
      const p = periodOf(r);
      if (!p) continue;
      const [mn, yy] = p.split(" ");
      add(p, Number(yy), MONTHS.indexOf(mn));
    }
    if (!m.has(defaultPeriod)) {
      const [mn, yy] = defaultPeriod.split(" ");
      add(defaultPeriod, Number(yy), MONTHS.indexOf(mn));
    }
    return [...m.values()].sort((a, b) => a.y - b.y || a.m - b.m).map((x) => x.label);
  }, [rows, defaultPeriod]);

  const val = (row: TrackerRow, field: keyof TrackerRow): string => {
    const e = edited.get(row.id);
    const v = e && field in e ? (e as Record<string, unknown>)[field] : row[field];
    return v == null ? "" : String(v);
  };
  const setField = (id: string, field: keyof TrackerRow, value: string) =>
    setEdited((prev) => {
      const n = new Map(prev);
      n.set(id, { ...(n.get(id) ?? {}), [field]: value });
      return n;
    });
  const save = async (id: string, field: keyof TrackerRow, value: string) => {
    setSaveState((prev) => new Map(prev).set(id, "saving"));
    try {
      await patchRenewal(id, { [field]: value });
      setSaveState((prev) => new Map(prev).set(id, "saved"));
    } catch {
      setSaveState((prev) => new Map(prev).set(id, "error"));
    }
  };
  const saveNum = (id: string, field: keyof TrackerRow) => (nv: string) => {
    setField(id, field, nv);
    save(id, field, nv);
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (month !== "All" && periodOf(r) !== month) return false;
      if (statusSel.length > 0 && !statusSel.includes(r.status)) return false;
      if (nlrSel.length > 0) {
        const t = nlrTier(r.live_nlr);
        if (!t || !nlrSel.includes(t)) return false;
      }
      if (riskFilter) {
        const rt = riskTier(r.live_nlr ?? r.static_nlr);
        if (rt !== riskFilter) return false;
      }
      if (underwriter !== "All" && (r.assigned_to ?? "") !== underwriter) return false;
      if (q && !r.group_display.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, month, statusSel, nlrSel, riskFilter, underwriter, search]);

  // Subtotal: renewed → renewed premium; otherwise → renewal (quote) premium.
  const subtotal = visible.reduce((s, r) => {
    const st = val(r, "status") || "In Progress";
    const raw = st === "Renewed" ? val(r, "final_renewed_premium") : val(r, "renewal_premium");
    const n = Number(raw);
    return s + (Number.isFinite(n) ? n : 0);
  }, 0);

  const activeSelect = (isActive: boolean) =>
    isActive
      ? { backgroundColor: ORANGE, color: "#0b1220", borderColor: ORANGE }
      : { backgroundColor: "#fff", color: "#0b1220", borderColor: "#e2e6ee" };

  return (
    <div>
      {/* pre-filter banner (e.g. arrived from the dashboard scoped to a risk band) */}
      {riskFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#f5dcc0] bg-[#fff6ec] px-4 py-2.5 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: RISK_META[riskFilter as keyof typeof RISK_META]?.color ?? ORANGE }}
          />
          <span className="font-semibold text-[#0b1220]">Filtered to {riskFilter}</span>
          <span className="text-xs text-[#5b6472]">
            {RISK_META[riskFilter as keyof typeof RISK_META]?.band}
          </span>
          <button
            type="button"
            onClick={() => setRiskFilter(undefined)}
            className="ml-1 rounded-full border border-[#f3c58f] px-2.5 py-0.5 text-xs font-medium text-[#b5560a] transition-colors hover:bg-white"
          >
            Clear ✕
          </button>
        </div>
      )}

      {/* filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="h-9 rounded-full border px-4 text-sm font-medium outline-none"
          style={activeSelect(month !== "All")}
        >
          <option value="All">All months</option>
          {periods.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>

        <MultiSelect label="Status" options={STATUS_OPTIONS} selected={statusSel} onChange={setStatusSel} width="w-48" />
        <MultiSelect label="NLR" options={[...NLR_TIERS]} selected={nlrSel} onChange={setNlrSel} width="w-72" />

        <select
          value={underwriter}
          onChange={(e) => setUnderwriter(e.target.value)}
          className="h-9 rounded-full border px-4 text-sm font-medium outline-none"
          style={activeSelect(underwriter !== "All")}
        >
          <option value="All">All underwriters</option>
          {underwriters.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search master contract…"
          className="h-9 w-56 rounded-full border border-[#e2e6ee] px-4 text-sm outline-none focus:border-[#b5560a]"
        />
        <span className="text-xs text-[#9aa2b1]">
          {visible.length} {visible.length === 1 ? "policy" : "policies"}, AED{" "}
          {Math.round(subtotal).toLocaleString("en-US")}
        </span>
      </div>

      {/* table */}
      <div className="mt-6 overflow-x-auto rounded-2xl border border-[#eceff4]">
        <table className="w-full border-collapse whitespace-nowrap text-sm">
          <thead>
            <tr className="border-b border-[#eceff4] text-left text-[11px] uppercase tracking-[0.1em] text-[#8b93a3]">
              <th className="px-4 py-3 font-semibold">Master Contract</th>
              <th className="px-4 py-3 font-semibold">Broker</th>
              <th className="px-4 py-3 font-semibold">Expiry</th>
              <th className="px-3 py-3 text-right font-semibold">Static NLR</th>
              <th className="px-3 py-3 font-semibold">Renewal Sent</th>
              <th className="px-3 py-3 text-right font-semibold">Renewal Prem.</th>
              <th className="px-3 py-3 text-right font-semibold">% Δ</th>
              <th className="px-3 py-3 text-right font-semibold">Census</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 text-right font-semibold">Final Prem.</th>
              <th className="px-3 py-3 text-right font-semibold">Final Census</th>
              <th className="px-3 py-3 font-semibold">Notes</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center text-sm text-[#9aa2b1]">
                  No renewals match these filters.
                </td>
              </tr>
            )}
            {visible.map((r) => {
              const st = saveState.get(r.id);
              const sentStr = val(r, "renewal_sent_date") || null;
              const db = daysBefore(sentStr, r.expiry_date);
              const staticHot = (r.static_nlr ?? 0) > 1;
              const deltaStr = val(r, "pct_delta");
              return (
                <tr key={r.id} className="jrow border-b border-[#f4f6fa] last:border-0">
                  <td className="px-4 py-2">
                    <Link
                      href={`/renewals/${r.id}`}
                      className="font-medium text-[#0b1220] hover:underline"
                      style={{ textDecorationColor: ORANGE_INK }}
                    >
                      {r.group_display}
                    </Link>
                    {(r.sub_policies ?? 1) > 1 && (
                      <span className="ml-2 rounded-full bg-[#eef2f9] px-1.5 py-0.5 text-[10px] font-medium text-[#40506b]">
                        {r.sub_policies}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-[#5b6472]">{r.broker_display ?? r.broker ?? "—"}</td>
                  <td className="px-4 py-2">
                    {fmtDate(r.expiry_date)}
                    <span className="ml-1 text-xs text-[#9aa2b1]">· {rel(r.days_to_expiry)}</span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.static_nlr == null ? (
                      <span className="text-[#c2c8d2]">—</span>
                    ) : (
                      <span style={{ color: staticHot ? PINK : GREEN }} className="font-semibold">
                        {nlrPct(r.static_nlr)}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="date"
                      value={val(r, "renewal_sent_date")}
                      onChange={(e) => setField(r.id, "renewal_sent_date", e.target.value)}
                      onBlur={(e) => save(r.id, "renewal_sent_date", e.target.value)}
                      className={cellCls}
                    />
                    <div className="mt-0.5 px-2 text-[10px] font-medium">
                      {db == null ? (
                        <span className="text-[#c2c8d2]">not sent</span>
                      ) : db >= 30 ? (
                        <span style={{ color: GREEN }}>✓ On time · {db}d before</span>
                      ) : db >= 0 ? (
                        <span style={{ color: PINK }}>⚠ Late · {db}d before</span>
                      ) : (
                        <span style={{ color: PINK }}>⚠ {-db}d after expiry</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <NumberCell value={val(r, "renewal_premium")} onSave={saveNum(r.id, "renewal_premium")} />
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center justify-end">
                      <input
                        type="number"
                        step="0.1"
                        value={deltaStr}
                        onChange={(e) => setField(r.id, "pct_delta", e.target.value)}
                        onBlur={(e) => save(r.id, "pct_delta", e.target.value)}
                        placeholder="—"
                        className={`${cellCls} w-14 text-right font-semibold`}
                        style={{ color: deltaStr === "" ? "#9aa2b1" : Number(deltaStr) >= 0 ? GREEN : PINK }}
                      />
                      <span className="text-[#9aa2b1]">%</span>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <NumberCell value={val(r, "quote_census")} onSave={saveNum(r.id, "quote_census")} />
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={val(r, "status") || "In Progress"}
                      onChange={(e) => {
                        setField(r.id, "status", e.target.value);
                        save(r.id, "status", e.target.value);
                      }}
                      className={statusClass(val(r, "status") || "In Progress")}
                    >
                      <option>In Progress</option>
                      <option>Renewed</option>
                      <option>Lost</option>
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <NumberCell value={val(r, "final_renewed_premium")} onSave={saveNum(r.id, "final_renewed_premium")} />
                  </td>
                  <td className="px-2 py-1.5">
                    <NumberCell value={val(r, "final_census")} onSave={saveNum(r.id, "final_census")} />
                  </td>
                  <td className="px-2 py-1.5">
                    <Link href={`/renewals/${r.id}`} className="group relative flex max-w-[200px] items-center">
                      {r.notes ? (
                        <span className="truncate text-[#5b6472]">{r.notes}</span>
                      ) : (
                        <span className="text-[#c2c8d2]">add…</span>
                      )}
                      {r.notes && (
                        <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-1 hidden w-72 whitespace-normal rounded-lg border border-[#e6e9f0] bg-white p-3 text-xs leading-relaxed text-[#0b1220] shadow-[0_12px_30px_-10px_rgba(15,23,42,0.35)] group-hover:block">
                          {r.notes}
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {st === "saving" && <span className="text-xs text-[#9aa2b1]">…</span>}
                    {st === "saved" && <span className="text-xs" style={{ color: GREEN }}>✓</span>}
                    {st === "error" && <span className="text-xs" style={{ color: PINK }}>!</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[#9aa2b1]">
        Grouped by upcoming start month (the day after expiry). Static NLR is frozen at first quote;
        live NLR and its trend live on each renewal&apos;s page. % Δ is manual for now. Notes are
        read-only here — hover to preview, click to edit.
      </p>
    </div>
  );
}

const cellCls =
  "rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none hover:border-[#e2e6ee] focus:border-[#b5560a] focus:bg-white";
