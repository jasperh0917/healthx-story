"use client";

import { useEffect, useState } from "react";
import type { TrackerRow } from "@/lib/renewals";
import { unsaved } from "@/lib/unsaved";

const NAVY = "#003780";
const PINK = "#f1517b";

const LOST_REASONS = [
  "High increase",
  "Client budget cut",
  "Service issues",
  "Policy cancelled (non-payment)",
  "Company closed down",
];

const inputCls =
  "w-full rounded-lg border border-[#e2e6ee] bg-white px-3 py-2 text-sm text-[#0b1220] outline-none focus:border-[#003780]";

export default function RenewalActivityForm({
  row,
  action,
  underwriters,
  products,
}: {
  row: TrackerRow;
  action: (formData: FormData) => void | Promise<void>;
  underwriters: string[];
  products: string[];
}) {
  const [status, setStatus] = useState<string>(row.status);
  const [dirty, setDirty] = useState(false);
  const isLost = status === "Lost";

  useEffect(() => {
    unsaved.dirty = dirty;
  }, [dirty]);
  useEffect(() => () => { unsaved.dirty = false; }, []);
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  return (
    <form
      action={action}
      onChange={() => setDirty(true)}
      onSubmit={() => {
        setDirty(false);
        unsaved.dirty = false;
      }}
      className="mt-5"
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Status">
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputCls}
          >
            <option>In Progress</option>
            <option>Renewed</option>
            <option>Lost</option>
          </select>
        </Field>
        <Field label="Renewal sent" hint="on-time = 30+ days before expiry">
          <input type="date" name="renewal_sent_date" defaultValue={row.renewal_sent_date ?? ""} className={inputCls} />
        </Field>
        <Field label="Assigned to">
          <select name="assigned_to" defaultValue={row.assigned_to ?? ""} className={inputCls}>
            <option value="">—</option>
            {underwriters.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </Field>

        <Field label="Renewal premium (AED)">
          <input type="number" step={1} min={0} name="renewal_premium" defaultValue={row.renewal_premium ?? ""} className={inputCls} />
        </Field>
        <Field label="Census (members)">
          <input type="number" step={1} min={0} name="quote_census" defaultValue={row.quote_census ?? ""} className={inputCls} />
        </Field>
        <Field label="% Δ (increase)" hint="manual for now — from quote builder later">
          <input type="number" step={0.1} name="pct_delta" defaultValue={row.pct_delta ?? ""} className={inputCls} />
        </Field>
        <Field label="Referred to QIC (date)" hint="hot groups sent to QIC">
          <input type="date" name="referred_qic_date" defaultValue={row.referred_qic_date ?? ""} className={inputCls} />
        </Field>

        <Field label="Final renewed premium (AED)">
          <input type="number" step={1} min={0} name="final_renewed_premium" defaultValue={row.final_renewed_premium ?? ""} className={inputCls} />
        </Field>
        <Field label="Final renewed census">
          <input type="number" step={1} min={0} name="final_census" defaultValue={row.final_census ?? ""} className={inputCls} />
        </Field>
        <Field label="Renewed product">
          <select name="renewed_product" defaultValue={row.renewed_product ?? ""} className={inputCls}>
            <option value="">—</option>
            {products.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <Field label="Notes">
          <textarea name="notes" defaultValue={row.notes ?? ""} rows={3} className={inputCls} />
        </Field>
      </div>

      {isLost && (
        <div className="mt-6 rounded-2xl border border-[#f2d9e1] bg-[#fdf6f8] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: PINK }}>
            Lost — capture the details
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-3">
            <Field label="Lost reason">
              <select name="lost_reason" defaultValue={row.lost_reason ?? ""} className={inputCls}>
                <option value="">—</option>
                {LOST_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Renewed broker" hint="only if switched">
              <input type="text" name="renewed_broker" defaultValue={row.renewed_broker ?? ""} className={inputCls} />
            </Field>
            <Field label="Renewed insurer" hint="who won it, if known">
              <input type="text" name="renewed_insurer" defaultValue={row.renewed_insurer ?? ""} className={inputCls} />
            </Field>
          </div>
        </div>
      )}
      {/* keep Lost fields in the payload even when hidden, so nothing is wiped on save */}
      {!isLost && (
        <>
          <input type="hidden" name="lost_reason" value={row.lost_reason ?? ""} />
          <input type="hidden" name="renewed_broker" value={row.renewed_broker ?? ""} />
          <input type="hidden" name="renewed_insurer" value={row.renewed_insurer ?? ""} />
        </>
      )}

      <button
        type="submit"
        className="mt-6 rounded-full border px-6 py-2.5 text-sm font-semibold transition-colors"
        style={
          dirty
            ? { backgroundColor: NAVY, color: "#fff", borderColor: NAVY }
            : { backgroundColor: "#fff", color: "#0b1220", borderColor: "#d7dce6" }
        }
      >
        Save changes
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[#0b1220]">{label}</span>
      {hint && <span className="ml-2 text-xs text-[#9aa2b1]">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
