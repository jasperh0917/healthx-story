import SmoothScroll from "@/components/SmoothScroll";
import Hero from "@/components/Hero";
import { Section, Bars, Reveal } from "@/components/Story";
import CountUp from "@/components/CountUp";
import CensusExplorer from "@/components/CensusExplorer";
import ClaimsExplorer from "@/components/ClaimsExplorer";
import { GrowthChart, CohortSplit } from "@/components/ArcVisuals";
import { actions, arc, census, inflation, networkNlr2025 } from "@/data/portfolio";

export default function Page() {
  const y24 = arc.y2024;
  const y25 = arc.y2025;

  return (
    <SmoothScroll>
      <main>
        <Hero />

        {/* ACT I — the arc */}
        <Section
          id="headline"
          eyebrow="The arc · 2024 → 2026"
          title={
            <>
              Took the market. <span className="text-grad">Kept the good.</span>{" "}
              Repriced the rest.
            </>
          }
          lede="Three underwriting years, one deliberate curve — 2024 bought us market share and the lessons, 2025 traded bad risk for good while the book kept growing, and 2026 starts ahead of the curve."
        >
          {/* 2024 — we took our market share */}
          <Chapter
            year="2024"
            kicker="We took our market share"
            body={
              <>
                An <strong className="text-white">AED 61M</strong>, 9,955-life portfolio built
                across {y24.groups} corporate groups — in our first year. We committed mistakes:
                the matured book ran a{" "}
                <strong className="text-rose-300">114% net loss ratio</strong>. And we learned
                from every one of them.
              </>
            }
          >
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Tile label="Gross premium" cool>
                <CountUp to={y24.gp} suffix="M" decimals={1} />
              </Tile>
              <Tile label="Lives covered">
                <CountUp to={y24.lives} decimals={0} />
              </Tile>
              <Tile label="Groups">
                <CountUp to={y24.groups} decimals={0} />
              </Tile>
              <Tile label="Net LR · matured" hot sub="the tuition fee">
                <CountUp to={y24.nlrMatured} suffix="%" decimals={1} />
              </Tile>
            </div>
          </Chapter>

          {/* 2025 · storyline 1 — removed the bad, stayed with the good */}
          <Chapter
            year="2025"
            kicker="Removed the bad, stayed with the good"
            body={
              <>
                Renewal was the filter — and the right way to read it is by premium, not logos. We
                shed <strong className="text-white">81% of loss-making premium</strong> and held on
                to <strong className="text-emerald-300">67% of performing premium</strong>, so{" "}
                <strong className="text-white">70% of the renewed book</strong> is performing risk.
                The groups we lost were the small ones.
              </>
            }
          >
            <CohortSplit />
          </Chapter>

          {/* 2025 · storyline 2 — grew while we cleaned */}
          <Chapter
            kicker="And still grew almost 40%"
            body={
              <>
                Pruning didn&apos;t shrink the book — premium grew{" "}
                <strong className="text-white">+{y25.gpGrowthPct}% to AED {y25.gp.toFixed(0)}M</strong>{" "}
                and lives grew +{y25.livesGrowthPct}% to 11,171, with renewals layered steadily
                under better-priced new business all year.
              </>
            }
          >
            <GrowthChart />
          </Chapter>

          {/* 2025 · storyline 3 — priced like we mean it */}
          <Chapter
            kicker="The loss ratio answered"
            body={
              <>
                Projected UY 2025 NLR is{" "}
                <strong className="text-emerald-300">{y25.nlrProjected.toFixed(0)}%</strong> — down
                ~18 points from the 114% the 2024 book matured at, and now below break-even. Average premium per member rose{" "}
                <strong className="text-white">+{y25.avgPremiumGrowthPct}%</strong> — nearly double
                the <strong className="text-white">+{inflation.y2025.pct}% medical inflation</strong>{" "}
                we measured in our own claims. By network, Restricted runs profitably, General sits
                at break-even, and Comprehensive is the one still burning.
              </>
            }
          >
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Tile label="Projected NLR · UY 2025" good sub="paid + 85% OS · annualised">
                <CountUp to={y25.nlrProjected} suffix="%" decimals={1} />
              </Tile>
              <Tile label="Projected GLR · UY 2025" sub="vs gross premium">
                <CountUp to={y25.glrProjected} suffix="%" decimals={1} />
              </Tile>
              <Tile label="Avg premium / member" sub={`AED · +${y25.avgPremiumGrowthPct}% vs 2024`}>
                <CountUp to={y25.avgPremium} decimals={0} />
              </Tile>
              <Tile label="Take rate" cool sub="1 − net ÷ gross premium">
                <CountUp to={y25.takeRate} suffix="%" decimals={1} />
              </Tile>
            </div>
            <div className="glass mt-4 p-6">
              <div className="grid gap-6 sm:grid-cols-[5fr_2fr]">
                <div>
                  <p className="eyebrow mb-4">Projected NLR · by network</p>
                  <div className="flex flex-wrap gap-x-10 gap-y-4">
                    {networkNlr2025.map((n) => (
                      <div key={n.code}>
                        <div
                          className={`font-display text-2xl font-semibold ${
                            n.nlr > 110 ? "text-rose-400" : n.nlr < 100 ? "text-emerald-300" : "text-white"
                          }`}
                        >
                          <CountUp to={n.nlr} suffix="%" decimals={1} />
                        </div>
                        <p className="mt-1 text-[13px] text-slate-400">{n.label}</p>
                        <p className="font-mono text-[10px] text-slate-600">
                          {n.npM.toFixed(1)}M net premium
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t hairline pt-5 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                  <p className="eyebrow mb-4">Medical inflation</p>
                  <div className="font-display text-2xl font-semibold text-rose-400">
                    <CountUp to={inflation.y2025.pct} suffix="%" decimals={1} />
                  </div>
                  <p className="mt-1 text-[13px] text-slate-400">2024 → 2025</p>
                  <p className="font-mono text-[10px] text-slate-600">same services, own claims</p>
                </div>
              </div>
            </div>
          </Chapter>

          {/* 2026 — ahead of the curve */}
          <Chapter
            year="2026"
            kicker="More of the same — by design"
            body={
              <>
                Q1 2026 wrote <strong className="text-white">AED 23.3M</strong> — our strongest
                first quarter yet. And the steering is showing up in the prices we pay: early-2026
                unit costs are running{" "}
                <strong className="text-emerald-300">{Math.abs(inflation.y2026.pct)}% below</strong>{" "}
                last year for the same services. We&apos;re harnessing our own claims data — 311,157
                lines of it — and getting <strong className="text-grad">ahead of the curve</strong>.
              </>
            }
          >
            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
              <div className="glass p-7">
                <p className="eyebrow mb-5">Gross premium written · first quarter</p>
                <Bars
                  items={arc.q1Trend.map((q) => ({
                    label: q.label,
                    value: q.gp,
                    display: `${q.gp.toFixed(1)}M`,
                  }))}
                  color="from-cyan-400 to-emerald-400"
                />
              </div>
              <Tile
                label="Unit cost · early 2026"
                good
                sub="same services & months vs 2025 · early read"
              >
                <CountUp to={inflation.y2026.pct} suffix="%" decimals={1} />
              </Tile>
            </div>
          </Chapter>
        </Section>

        {/* ACT II — who we cover */}
        <Section
          id="census"
          eyebrow="The risk pool"
          title={
            <>
              A <span className="text-grad">young book</span> — finally priced like one.
            </>
          }
          lede="This is the cheapest risk pool in medicine: 61% of members are 26–45, barely 3% are past 55, and the active book is just as young. In 2024 we squandered that advantage at a 114% loss ratio. Today the same young census runs at a profit — and that's the upside story: catch the chronic conditions at 35 instead of 55, and a book this young only gets better from here."
        >
          <CensusExplorer />
        </Section>

        {/* ACT III — the combined claims story */}
        <Section
          id="claims"
          eyebrow="Claims Profile"
          accent="violet"
          title={
            <>
              <span className="text-grad">Predictable.</span>
            </>
          }
          lede="Out-patient takes two of every three dirhams — as expected. Claims by relation hold one twist: spouses are 11% of the book but 20% of claims, roughly 1.8× per head, driven by maternity — but maternity is forecastable, so it's priced, not a surprise. And the cost-per-episode ranking confirms the gut feel too: the providers everyone assumes are the expensive ones — KCH, Al Zahra, Mediclinic — are exactly where the data lands. A book whose one exception is this explainable is a book you can price. Slice everything below by network."
        >
          <ClaimsExplorer />
        </Section>

        {/* ACT IV — outlook */}
        <Section
          id="outlook"
          eyebrow="Outlook"
          accent="emerald"
          title={
            <>
              Predictable, therefore{" "}
              <span className="text-emerald-300">manageable</span>.
            </>
          }
          lede="A book that behaves as expected is a book you can steer. The network loss ratios say exactly where to act in 2026 — and with our own claims data in hand, we move before the market does. Stay ahead of the curve."
        >
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {actions.map((a, i) => (
              <div key={a.title} className="glass p-7 transition-transform hover:-translate-y-1">
                <p className="eyebrow mb-3 !text-emerald-300/80">Move {i + 1}</p>
                <h3 className="font-display text-lg font-semibold text-white">{a.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{a.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <footer className="border-t hairline px-6 py-14">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-600">
            <span>
              well<span className="text-grad">x</span> pulse · built from the live policy database
            </span>
            <span>trr 892 · claims 311,157 · AED</span>
          </div>
        </footer>
      </main>
    </SmoothScroll>
  );
}

function Tile({
  label,
  children,
  hot,
  cool,
  good,
  sub,
}: {
  label: string;
  children: React.ReactNode;
  hot?: boolean;
  cool?: boolean;
  good?: boolean;
  sub?: string;
}) {
  return (
    <div className={`glass p-6 ${hot ? "glow-coral" : cool ? "glow-cyan" : good ? "glow-emerald" : ""}`}>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <div
        className={`font-display text-4xl font-semibold ${
          hot ? "text-rose-400" : cool ? "text-cyan-300" : good ? "text-emerald-300" : "text-white"
        }`}
      >
        {children}
      </div>
      {sub && <p className="mt-2 font-mono text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

function Chapter({
  year,
  kicker,
  body,
  children,
}: {
  year?: string;
  kicker: string;
  body: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Reveal className="mt-20 first:mt-14">
      <div className="grid gap-6 lg:grid-cols-[120px_1fr]">
        <div className="flex items-baseline gap-4 lg:flex-col lg:items-stretch lg:gap-3">
          {year ? (
            <span className="font-display text-4xl font-bold tracking-tight text-grad">{year}</span>
          ) : (
            <span className="hidden font-display text-4xl lg:block">&nbsp;</span>
          )}
          <span className="hidden min-h-16 w-px flex-1 bg-gradient-to-b from-white/25 to-transparent lg:block" />
        </div>
        <div className="min-w-0">
          <p className="eyebrow mb-3">{kicker}</p>
          <p className="max-w-2xl text-[15px] leading-relaxed text-slate-400">{body}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </Reveal>
  );
}
