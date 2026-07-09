// Both NLR metrics on the renewal page: the frozen "static" NLR captured at the
// first quote, the live NLR now, and the change between them over N months.
const PINK = "#f1517b";
const GREEN = "#1a7a44";
const raleway = { fontFamily: "Raleway, sans-serif" } as const;

const SCALE = 1.6; // NLR at which a bar is full width

function pct(n: number | null) {
  return n == null ? "—" : `${(n * 100).toFixed(0)}%`;
}

function Bar({ label, sub, nlr }: { label: string; sub: string; nlr: number | null }) {
  const w = nlr == null ? 0 : Math.min(Math.max(nlr, 0), SCALE) / SCALE * 100;
  const color = (nlr ?? 0) > 1 ? PINK : GREEN;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a3]">{label}</span>
        <span style={{ ...raleway, color }} className="text-2xl font-bold">{pct(nlr)}</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#eef1f6]">
        <div className="h-full rounded-full" style={{ width: `${w}%`, backgroundColor: color }} />
      </div>
      <p className="mt-1 text-[11px] text-[#9aa2b1]">{sub}</p>
    </div>
  );
}

export default function NlrTrend({
  liveNlr,
  staticNlr,
  months,
}: {
  liveNlr: number | null;
  staticNlr: number | null;
  months: number | null;
}) {
  const deltaPts = liveNlr != null && staticNlr != null ? (liveNlr - staticNlr) * 100 : null;
  const up = (deltaPts ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-[#eceff4] p-5">
      <div className="grid gap-6 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
        <Bar
          label="Static NLR · at quote"
          sub={staticNlr == null ? "not quoted yet" : "frozen when the renewal was first quoted"}
          nlr={staticNlr}
        />
        <Bar label="Live NLR · now" sub="today, live from TRR" nlr={liveNlr} />
        <div className="sm:border-l sm:border-[#eceff4] sm:pl-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b93a3]">Change</p>
          {deltaPts == null ? (
            <p className="mt-1 text-sm text-[#9aa2b1]">—</p>
          ) : (
            <>
              <p style={{ ...raleway, color: up ? PINK : GREEN }} className="text-2xl font-bold">
                {up ? "▲ +" : "▼ −"}
                {Math.abs(deltaPts).toFixed(0)} pts
              </p>
              <p className="mt-1 text-[11px] text-[#9aa2b1]">
                over {months == null ? "—" : months} {months === 1 ? "month" : "months"}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
