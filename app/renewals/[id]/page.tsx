import { notFound } from "next/navigation";
import { getRenewal } from "@/lib/renewals";
import { updateRenewal } from "@/lib/renewals-actions";
import { listUnderwriters } from "@/lib/underwriters";
import RenewalActivityForm from "@/components/RenewalActivityForm";
import GuardedBackLink from "@/components/GuardedBackLink";
import NlrTrend from "@/components/NlrTrend";

export const dynamic = "force-dynamic";

const PINK = "#f1517b";
const GREEN = "#1a7a44";
const raleway = { fontFamily: "Raleway, sans-serif" } as const;

// Product lines stay fixed until the admin panel (Step 9); underwriters are dynamic.
const PRODUCTS = ["HealthX Exclusive", "QIC-HealthX"];

function nlrPct(n: number | null) {
  return n == null ? "—" : `${(n * 100).toFixed(0)}%`;
}
function aed(n: number | null) {
  return n == null ? "—" : `AED ${Math.round(n).toLocaleString("en-US")}`;
}
function fmtDate(d: string | null) {
  return d
    ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";
}

export default async function RenewalDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const [row, underwriters] = await Promise.all([getRenewal(id), listUnderwriters()]);
  if (!row) notFound();

  const hot = (row.live_nlr ?? 0) > 1;
  const save = updateRenewal.bind(null, id);
  const months = row.static_nlr_at
    ? Math.max(0, Math.round((Date.now() - new Date(row.static_nlr_at).getTime()) / (30 * 864e5)))
    : null;

  return (
    <div className="min-h-screen w-full bg-white text-[#0b1220]">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        <GuardedBackLink href="/renewals" className="text-sm text-[#5b6472] transition-colors hover:text-[#0b1220]">
          ← Renewal Tracker
        </GuardedBackLink>

        {saved && (
          <div className="mt-4 rounded-lg border border-[#cfead9] bg-[#effaf3] px-4 py-2 text-sm" style={{ color: GREEN }}>
            ✓ Saved.
          </div>
        )}

        {/* header */}
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 style={raleway} className="text-3xl font-extrabold tracking-tight">
              {row.group_display}
            </h1>
            <p className="mt-2 text-sm text-[#5b6472]">
              {row.broker_display ?? row.broker ?? "—"} · {row.product_line ?? "—"}
              {(row.sub_policies ?? 1) > 1 && (
                <span className="ml-2 rounded-full bg-[#eef2f9] px-2 py-0.5 text-xs text-[#40506b]">
                  {row.sub_policies} sub-policies rolled up
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a3]">Live NLR · now</p>
            <p style={{ ...raleway, color: hot ? PINK : GREEN }} className="text-4xl font-bold">
              {nlrPct(row.live_nlr)}
            </p>
            <p className="text-xs font-medium" style={{ color: hot ? PINK : GREEN }}>
              {row.feeling ?? ""}
            </p>
          </div>
        </div>

        {hot && (
          <div className="mt-5 rounded-xl border border-[#f6d7e0] bg-[#fdf3f6] px-4 py-3 text-sm" style={{ color: "#b02650" }}>
            Running over 100% — quote it ourselves first, then consider a QIC referral (log the date below).
          </div>
        )}

        {/* live facts from TRR (read only) */}
        <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fact label="Start month" value={row.start_month ?? "—"} />
          <Fact
            label="Expiry"
            value={`${fmtDate(row.expiry_date)}${row.days_to_expiry != null ? ` · ${row.days_to_expiry}d` : ""}`}
          />
          <Fact label="Net premium" value={aed(row.net_premium)} />
          <Fact label="Gross premium" value={aed(row.gross_premium)} />
        </section>

        {/* Both NLR metrics: static (frozen at quote) vs live (now), with the trend */}
        <section className="mt-6">
          <NlrTrend liveNlr={row.live_nlr} staticNlr={row.static_nlr} months={months} />
        </section>

        {/* editable activity */}
        <section className="mt-10">
          <h2 style={raleway} className="text-lg font-bold">
            Renewal Activity
          </h2>
          <p className="mt-1 text-sm text-[#5b6472]">
            The facts above stay live from TRR. Everything below is yours to update — it mirrors your
            Renewal Tracker sheet.
          </p>
          <RenewalActivityForm row={row} action={save} underwriters={underwriters} products={PRODUCTS} />
        </section>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#eceff4] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a3]">{label}</p>
      <p className="mt-1.5 text-base font-medium">{value}</p>
    </div>
  );
}
