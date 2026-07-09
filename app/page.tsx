import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPortfolioSummary } from "@/lib/portfolio-summary";
import { isDemoMode } from "@/lib/demo-mode-server";
import { signOut } from "@/lib/auth/sign-out";
import JasperLogo from "@/components/JasperLogo";
import DemoModeToggle from "@/components/DemoModeToggle";

// Always render live — the headline numbers read from TRR on each visit.
export const dynamic = "force-dynamic";

const NAVY = "#003780"; // WellX "Trust" — the one accent
const PINK = "#f1517b"; // warnings / hot groups only
const raleway = { fontFamily: "Raleway, sans-serif" } as const;

function aedM(n: number): string {
  if (!n) return "—";
  return `AED ${(n / 1_000_000).toFixed(1)}M`;
}

export default async function Home() {
  const [user, s, demo] = await Promise.all([getCurrentUser(), getPortfolioSummary(), isDemoMode()]);
  const firstName = (user?.full_name ?? "there").split(" ")[0];
  const scope =
    user?.role === "head" ? "the whole book" : `the ${user?.product_line ?? "HealthX"} book`;

  return (
    <div className="min-h-screen w-full bg-white text-[#0b1220]">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {/* ── top bar: mark · sign out ─────────────────────────────── */}
        <div className="flex items-center justify-between">
          <JasperLogo variant="light" size="sm" />
          <div className="flex items-center gap-3">
            <DemoModeToggle initial={demo} />
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-[#e2e6ee] px-4 py-1.5 text-xs text-[#5b6472] transition-colors hover:border-[#c7cdd9] hover:text-[#0b1220]"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* ── greeting ─────────────────────────────────────────────── */}
        <header className="mt-14">
          <h1 style={raleway} className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Good to see you, {firstName}.
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#5b6472]">
            Here&apos;s {scope} at a glance — live from TRR and CUR. Start wide, then dive in.
          </p>
        </header>

        {/* ── overview cards ───────────────────────────────────────── */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            href="/portfolio"
            label="Book premium"
            value={aedM(s.grossPremium)}
            sub="gross written · in-force"
          />
          <Card
            href="/portfolio"
            label="Blended NLR"
            value={s.blendedNlr ? `${(s.blendedNlr * 100).toFixed(1)}%` : "—"}
            sub="in-force · premium-weighted · incl. outstanding"
            accent={s.blendedNlr > 1 ? PINK : NAVY}
          />
          <Card
            href="/renewals"
            label="Hot groups"
            value={s.live ? String(s.hotGroups) : "—"}
            sub="in-force · over 100% NLR"
            accent={PINK}
          />
          <Card
            href="/renewals"
            label="Expiring soon"
            value={s.live ? String(s.expiringSoon) : "—"}
            sub="within the next 60 days"
          />
        </section>

        {!s.live && (
          <p className="mt-4 text-xs text-[#b0451f]">
            Couldn&apos;t reach the live data just now — numbers show a dash rather than a guess.
          </p>
        )}

        {/* ── ways in ──────────────────────────────────────────────── */}
        <section className="mt-12 grid gap-4 sm:grid-cols-2">
          <Panel
            href="/renewals"
            title="Renewal tracker"
            body="The working list — every renewal with its live NLR, on-time flag, latest quote and status."
            cta="Open the tracker"
          />
          <Panel
            href="/portfolio"
            title="Portfolio story"
            body="The full picture — three underwriting years of premium, loss ratios, census and claims."
            cta="See the whole book"
          />
        </section>

        {/* ── footer ───────────────────────────────────────────────── */}
        <footer className="mt-16 border-t border-[#eceff4] pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#9aa2b1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/powered-by-wellx-labs.png" alt="Powered by Wellx Labs" className="h-10 w-auto opacity-80" />
            <span className="max-w-md text-right">
              All data is handled in line with UAE medical confidentiality requirements.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Card({
  href,
  label,
  value,
  sub,
  accent = NAVY,
}: {
  href: string;
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-[#eceff4] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#d7dce6] hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a3]">{label}</p>
      <p style={{ ...raleway, color: accent }} className="mt-3 text-3xl font-bold tracking-tight">
        {value}
      </p>
      <p className="mt-2 text-xs text-[#9aa2b1]">{sub}</p>
    </Link>
  );
}

function Panel({
  href,
  title,
  body,
  cta,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-[#eceff4] p-6 transition-all hover:border-[#d7dce6] hover:shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)]"
    >
      <h3 style={raleway} className="text-lg font-bold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#5b6472]">{body}</p>
      <span
        style={{ color: NAVY }}
        className="mt-4 text-sm font-semibold transition-transform group-hover:translate-x-0.5"
      >
        {cta} →
      </span>
    </Link>
  );
}
