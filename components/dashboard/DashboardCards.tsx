"use client";

// Client shell for the Renewal Dashboard. Owns the modal state and the
// clickthrough wiring; the two cards below are presentational.
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DashboardData, MonthPremium, PipelineReport } from "@/lib/dashboard-shared";
import { pctRenewed } from "@/lib/dashboard-shared";
import type { RiskTier } from "@/lib/risk";
import Modal from "@/components/dashboard/Modal";
import RiskBreakdown from "@/components/dashboard/RiskBreakdown";
import { aedShort, aed, ratioPct } from "@/components/dashboard/format";

const ORANGE = "#fb9b35"; // WellX Energy Orange — fills / accents
const ORANGE_INK = "#b5560a"; // deeper orange — readable text & links on white

type ModalState =
  | { kind: "month"; data: MonthPremium; heading: string }
  | { kind: "pipeline"; data: PipelineReport }
  | null;

export default function DashboardCards({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [modal, setModal] = useState<ModalState>(null);

  // Interaction 2 (Card 2): route to the tracker, pre-filtered to the in-progress
  // pipeline. The tracker's Month filter is single-select, so rather than hide
  // one of the two target months we land on Month = All + Status = In Progress —
  // the full working pipeline. (Swap `month` below to a specific label to scope
  // to one month, once the tracker supports a multi-month filter.)
  const openTracker = () => {
    const params = new URLSearchParams({ month: "All", status: "In Progress" });
    router.push(`/renewals?${params.toString()}`);
  };

  // Card 1 clickthrough: from a month's risk band → the tracker, showing EVERY
  // policy that was up for renewal in that band that month (renewed + lost +
  // in-progress) — i.e. the % Renewed denominator. No status filter.
  const openTrackerForTier = (month: MonthPremium, tier: RiskTier) => {
    const params = new URLSearchParams({ month: month.monthLabel, risk: tier });
    router.push(`/renewals?${params.toString()}`);
  };

  return (
    <>
      <section className="grid gap-5 lg:grid-cols-2">
        <RenewedPremiumCard
          metrics={data.renewed}
          onDrill={(m, heading) => setModal({ kind: "month", data: m, heading })}
        />
        <PipelineCard
          pipeline={data.pipeline}
          onRiskBreakdown={() => setModal({ kind: "pipeline", data: data.pipeline })}
          onOpenTracker={openTracker}
        />
      </section>

      {modal?.kind === "month" && (
        <Modal
          title={modal.heading}
          subtitle={`Renewed ${aed(modal.data.total)} · ${ratioPct(
            pctRenewed(modal.data.total, modal.data.bookBase),
          )} of the expiring book renewed · ${modal.data.groups} groups`}
          onClose={() => setModal(null)}
        >
          <RiskBreakdown
            buckets={modal.data.byRisk}
            showRetention
            onTierClick={(tier) => openTrackerForTier(modal.data, tier)}
          />
        </Modal>
      )}

      {modal?.kind === "pipeline" && (
        <Modal
          title="Pipeline by risk"
          subtitle={`${modal.data.months.map((m) => m.monthLabel).join(" + ")} · ${aed(modal.data.total)} in progress`}
          onClose={() => setModal(null)}
        >
          <RiskBreakdown buckets={modal.data.byRisk} />
        </Modal>
      )}
    </>
  );
}

// ── Card 1 — Renewed Gross Premium ───────────────────────────────────────────

function RenewedPremiumCard({
  metrics,
  onDrill,
}: {
  metrics: DashboardData["renewed"];
  onDrill: (m: MonthPremium, heading: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#eceff4] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: "Raleway, sans-serif" }} className="text-lg font-bold tracking-tight text-[#0b1220]">
          Renewed gross premium
        </h2>
        <span className="rounded-full bg-[#f1f3f8] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8b93a3]">
          Closed
        </span>
      </div>
      <p className="mt-1 text-xs text-[#9aa2b1]">Renewals signed and booked. Tap a month for its risk mix.</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MetricTile
          label="This month"
          month={metrics.current}
          onClick={() => onDrill(metrics.current, `${metrics.current.monthLabel} — this month`)}
        />
        <MetricTile
          label="Last month"
          month={metrics.last}
          onClick={() => onDrill(metrics.last, `${metrics.last.monthLabel} — last month`)}
        />
      </div>
    </div>
  );
}

function MetricTile({ label, month, onClick }: { label: string; month: MonthPremium; onClick: () => void }) {
  const retention = pctRenewed(month.total, month.bookBase);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col rounded-xl border border-[#eceff4] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#c7cdd9] hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]"
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a3]">{label}</span>
      <span className="mt-1 text-[11px] text-[#9aa2b1]">{month.monthLabel}</span>
      <span
        style={{ fontFamily: "Raleway, sans-serif", color: ORANGE_INK }}
        className="mt-2 text-2xl font-bold tracking-tight"
      >
        {aedShort(month.total)}
      </span>
      <span className="mt-2 flex items-baseline gap-1.5">
        <span
          style={{ color: retention != null && retention >= 0.8 ? "#1a7a44" : "#b0451f" }}
          className="text-sm font-bold"
        >
          {ratioPct(retention)}
        </span>
        <span className="text-[11px] text-[#9aa2b1]">of expiring book renewed</span>
      </span>
      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#5b6472] transition-colors group-hover:text-[#0b1220]">
        {month.groups} groups · view risk mix
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </span>
    </button>
  );
}

// ── Card 2 — Pipeline Report ─────────────────────────────────────────────────

function PipelineCard({
  pipeline,
  onRiskBreakdown,
  onOpenTracker,
}: {
  pipeline: PipelineReport;
  onRiskBreakdown: () => void;
  onOpenTracker: () => void;
}) {
  const window = pipeline.mode === "early" ? "current + last month" : "current + next month";

  return (
    <div className="rounded-2xl border border-[#eceff4] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 style={{ fontFamily: "Raleway, sans-serif" }} className="text-lg font-bold tracking-tight text-[#0b1220]">
          Pipeline report
        </h2>
        <span className="rounded-full bg-[#fff2e0] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#b5560a]">
          In progress
        </span>
      </div>
      <p className="mt-1 text-xs text-[#9aa2b1]">Open renewals for {window}.</p>

      <div className="mt-5 rounded-xl border border-[#eceff4] p-4">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a3]">
          Pipeline value
        </span>
        <div className="mt-2 flex items-baseline gap-2">
          <span style={{ fontFamily: "Raleway, sans-serif", color: ORANGE_INK }} className="text-3xl font-bold tracking-tight">
            {aedShort(pipeline.total)}
          </span>
          <span className="text-xs text-[#9aa2b1]">· {pipeline.accounts} accounts</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {pipeline.months.map((m) => (
            <span key={m.monthKey} className="rounded-full bg-[#f5f7fb] px-3 py-1 text-xs text-[#5b6472]">
              {m.monthLabel} · {aedShort(m.total)}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <ActionButton onClick={onRiskBreakdown} tone="ghost">
          View risk breakdown
        </ActionButton>
        <ActionButton onClick={onOpenTracker} tone="solid">
          Open in tracker
        </ActionButton>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  tone,
  children,
}: {
  onClick: () => void;
  tone: "solid" | "ghost";
  children: React.ReactNode;
}) {
  const base =
    "group flex items-center justify-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all";
  if (tone === "solid") {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{ backgroundColor: ORANGE }}
        className={`${base} text-[#0b1220] hover:brightness-105`}
      >
        {children}
        <span className="transition-transform group-hover:translate-x-0.5">→</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} border border-[#e2e6ee] text-[#0b1220] hover:border-[#c7cdd9] hover:bg-[#f5f7fb]`}
    >
      {children}
      <span className="transition-transform group-hover:translate-x-0.5">→</span>
    </button>
  );
}
