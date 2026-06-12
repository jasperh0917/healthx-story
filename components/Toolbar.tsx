"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { actions, arc, census, claimsStory, headline, inflation, networkNlr2025 } from "@/data/portfolio";

export default function Toolbar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as "dark" | "light") ?? "dark";
    setTheme(saved);
    document.documentElement.classList.toggle("light", saved === "light");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  // Scroll-sweep the page so every whileInView animation reaches its final
  // state, force the light palette, print, then restore.
  const handlePrint = async () => {
    setBusy("print");
    const wasLight = document.documentElement.classList.contains("light");
    document.documentElement.classList.add("light");
    const step = window.innerHeight * 0.8;
    for (let y = 0; y <= document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 1200));
    const restore = () => {
      if (!wasLight) document.documentElement.classList.remove("light");
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setBusy(null);
    window.print();
  };

  const handlePpt = async () => {
    setBusy("ppt");
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const pptx = new PptxGenJS();
      pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
      pptx.layout = "WIDE";

      const INK = "0f172a";
      const MUTED = "475569";
      const CYAN = "0e7490";
      const ROSE = "e11d48";
      const EMERALD = "047857";

      type Slide = ReturnType<typeof pptx.addSlide>;
      const title = (s: Slide, text: string, sub?: string) => {
        s.addText(text, { x: 0.6, y: 0.45, w: 12, h: 0.8, fontSize: 30, bold: true, color: INK, fontFace: "Arial" });
        if (sub) s.addText(sub, { x: 0.6, y: 1.15, w: 12, h: 0.4, fontSize: 13, color: MUTED, fontFace: "Arial" });
      };
      const stat = (s: Slide, x: number, y: number, value: string, label: string, color = INK) => {
        s.addText(value, { x, y, w: 2.9, h: 0.7, fontSize: 28, bold: true, color, fontFace: "Arial" });
        s.addText(label, { x, y: y + 0.6, w: 2.9, h: 0.5, fontSize: 11, color: MUTED, fontFace: "Arial" });
      };

      // 1 · Title
      let s = pptx.addSlide();
      s.background = { color: "f3f5fa" };
      s.addText("Healthx Story", { x: 0.8, y: 2.4, w: 11.7, h: 1.1, fontSize: 54, bold: true, color: INK, fontFace: "Arial" });
      s.addText("Portfolio performance, insights & outlook · June 2026", { x: 0.85, y: 3.6, w: 11, h: 0.5, fontSize: 18, color: MUTED, fontFace: "Arial" });
      s.addText(
        `${headline.totals.claimsPaidM}M AED claims paid · ${headline.totals.grossPremiumM}M AED gross premium · ${headline.totals.brokers} broker partners`,
        { x: 0.85, y: 4.3, w: 11, h: 0.4, fontSize: 13, color: CYAN, fontFace: "Arial" }
      );

      // 2 · 2024
      s = pptx.addSlide();
      title(s, "2024 — We took our market share", "An AED 61M portfolio built in our first year. We committed mistakes — and learned from every one.");
      stat(s, 0.8, 2.2, `${arc.y2024.gp.toFixed(1)}M`, "AED gross premium");
      stat(s, 3.9, 2.2, arc.y2024.lives.toLocaleString(), "lives covered");
      stat(s, 7.0, 2.2, String(arc.y2024.groups), "corporate groups (consolidated)");
      stat(s, 10.1, 2.2, `${arc.y2024.nlrMatured.toFixed(0)}%`, "net LR · matured book", ROSE);

      // 3 · 2025 renewal filter
      s = pptx.addSlide();
      title(s, "2025 — Removed the bad, stayed with the good", "Renewal was the filter. The book we kept is the book we wanted.");
      const g = arc.cohorts.good, b = arc.cohorts.bad;
      const renewedBookGp = g.gpRenewed + b.gpKept;
      stat(s, 0.8, 2.2, `${Math.round((100 * b.gpRemoved) / b.gpTotal)}%`, `of loss-making premium removed (AED ${b.gpRemoved.toFixed(1)}M of ${b.gpTotal.toFixed(1)}M)`, ROSE);
      stat(s, 4.6, 2.2, `${Math.round((100 * g.gpRenewed) / renewedBookGp)}%`, "of the renewed book is performing premium", EMERALD);
      stat(s, 8.4, 2.2, `AED ${g.gpRenewed.toFixed(1)}M`, `performing premium renewed of ${g.gpTotal.toFixed(1)}M (${g.renewedGroups}/${g.groups} groups)`);
      s.addText("performing = paid NLR ≤ 100% at the UY 2024 snapshot · by gross premium written · groups consolidated across name variants", { x: 0.8, y: 6.6, w: 12, h: 0.4, fontSize: 10, color: MUTED, fontFace: "Arial" });

      // 4 · growth
      s = pptx.addSlide();
      title(s, "2025 — And still grew almost 40%", "Renewals layered under better-priced new business, all year.");
      stat(s, 0.8, 2.2, `${arc.y2025.gp.toFixed(1)}M`, `AED gross premium · +${arc.y2025.gpGrowthPct}%`);
      stat(s, 3.9, 2.2, arc.y2025.lives.toLocaleString(), `lives · +${arc.y2025.livesGrowthPct}%`);
      stat(s, 7.0, 2.2, `${arc.y2025.renewalGp.toFixed(1)}M`, "renewed business", EMERALD);
      stat(s, 10.1, 2.2, `${arc.y2025.newGp.toFixed(1)}M`, "new business", CYAN);
      const months = ["J","F","M","A","M","J","J","A","S","O","N","D"];
      const chartData = [
        { name: "2024 book", labels: [...months, ...months], values: [...arc.monthlyGp2024.map((_, i) => arc.monthlyGp2024.slice(0, i + 1).reduce((a, c) => a + c, 0)), ...arc.monthlyGp2025Renewal.map(() => 61.1)] },
        { name: "2025 renewed", labels: [...months, ...months], values: [...months.map(() => 0), ...arc.monthlyGp2025Renewal.map((_, i) => arc.monthlyGp2025Renewal.slice(0, i + 1).reduce((a, c) => a + c, 0))] },
        { name: "2025 new", labels: [...months, ...months], values: [...months.map(() => 0), ...arc.monthlyGp2025New.map((_, i) => arc.monthlyGp2025New.slice(0, i + 1).reduce((a, c) => a + c, 0))] },
      ];
      s.addChart(pptx.ChartType.bar, chartData, { x: 0.8, y: 3.3, w: 11.7, h: 3.6, barGrouping: "stacked", chartColors: ["94a3b8", "10b981", "06b6d4"], showLegend: true, legendPos: "b", catAxisLabelFontSize: 8, valAxisLabelFontSize: 9 });

      // 5 · loss ratio
      s = pptx.addSlide();
      title(s, "2025 — The loss ratio answered", `Projected NLR ${arc.y2025.nlrProjected.toFixed(0)}% — down from 115% matured 2024 · premium +${arc.y2025.avgPremiumGrowthPct}% vs medical inflation +${inflation.y2025.pct}%`);
      stat(s, 0.8, 2.2, `${arc.y2025.nlrProjected.toFixed(1)}%`, "projected NLR · paid + 85% OS, annualised", EMERALD);
      stat(s, 3.9, 2.2, `${arc.y2025.glrProjected.toFixed(1)}%`, "projected GLR");
      stat(s, 7.0, 2.2, arc.y2025.avgPremium.toLocaleString(), `avg premium / member · +${arc.y2025.avgPremiumGrowthPct}%`);
      stat(s, 10.1, 2.2, `${arc.y2025.takeRate.toFixed(1)}%`, "take rate · 1 − net ÷ gross");
      s.addText("Projected NLR by network", { x: 0.8, y: 4.1, w: 6, h: 0.4, fontSize: 14, bold: true, color: INK, fontFace: "Arial" });
      networkNlr2025.forEach((n, i) => {
        stat(s, 0.8 + i * 3.1, 4.6, `${n.nlr.toFixed(1)}%`, `${n.label} · ${n.npM.toFixed(1)}M NP`, n.nlr > 110 ? ROSE : n.nlr < 100 ? EMERALD : INK);
      });
      stat(s, 10.1, 4.6, `+${inflation.y2025.pct}%`, "medical inflation · same services, own claims", ROSE);

      // 6 · census
      s = pptx.addSlide();
      title(s, "The risk pool — a young book, finally priced like one", "61% aged 26–45, barely 3% past 55. Same census that ran 115% in 2024 now runs at break-even.");
      const cs = census.all;
      type Cell = { text: string; options?: { bold?: boolean } };
      const rows: Cell[][] = [
        [{ text: "Members", options: { bold: true } }, { text: cs.total.toLocaleString() }, { text: "Active members", options: { bold: true } }, { text: census.active.total.toLocaleString() }],
        [{ text: "Male / Female", options: { bold: true } }, { text: "60% / 40%" }, { text: "Principals", options: { bold: true } }, { text: "68.8%" }],
        ...cs.nationality.map((n): Cell[] => [{ text: n.label, options: { bold: true } }, { text: `${n.value.toLocaleString()} · ${n.pct}%` }, { text: "" }, { text: "" }]),
      ];
      s.addTable(rows, { x: 0.8, y: 2.1, w: 11.7, fontSize: 12, color: MUTED, border: { type: "solid", color: "e2e8f0", pt: 0.5 }, fill: { color: "ffffff" }, fontFace: "Arial" });

      // 7 · claims
      s = pptx.addSlide();
      title(s, "Claims profile — predictable", "OP takes 2 of 3 dirhams · relation mirrors the census · the expensive providers are exactly who you'd guess.");
      const provAgg = new Map<string, { aed: number; ep: number }>();
      claimsStory.providersByNetwork.forEach(([, pg, aed, ep]) => {
        const cur = provAgg.get(pg) ?? { aed: 0, ep: 0 };
        provAgg.set(pg, { aed: cur.aed + aed, ep: cur.ep + ep });
      });
      const topProv = [...provAgg.entries()].map(([label, v]) => ({ label, ...v, per: v.aed / v.ep })).sort((a, c) => c.per - a.per).slice(0, 5);
      s.addText("Top 5 by cost per episode", { x: 0.8, y: 2.0, w: 6, h: 0.4, fontSize: 14, bold: true, color: INK, fontFace: "Arial" });
      topProv.forEach((p, i) => {
        s.addText(`${p.label} — AED ${Math.round(p.per).toLocaleString()}/episode × ${(p.ep / 1000).toFixed(1)}k episodes (${(p.aed / 1e6).toFixed(1)}M)`, { x: 0.9, y: 2.5 + i * 0.45, w: 11.5, h: 0.4, fontSize: 13, color: i < 3 ? ROSE : MUTED, fontFace: "Arial" });
      });
      s.addText(`${claimsStory.episodes.toLocaleString()} care episodes across the book · provider groups consolidated`, { x: 0.8, y: 6.6, w: 12, h: 0.4, fontSize: 10, color: MUTED, fontFace: "Arial" });

      // 8 · outlook
      s = pptx.addSlide();
      title(s, "Outlook — predictable, therefore manageable", `Early-2026 unit costs running ${Math.abs(inflation.y2026.pct)}% below last year for the same services. Stay ahead of the curve.`);
      actions.forEach((a, i) => {
        s.addText(`Move ${i + 1} — ${a.title}`, { x: 0.8, y: 2.2 + i * 1.5, w: 11.7, h: 0.45, fontSize: 17, bold: true, color: EMERALD, fontFace: "Arial" });
        s.addText(a.body, { x: 0.8, y: 2.65 + i * 1.5, w: 11.7, h: 0.9, fontSize: 12, color: MUTED, fontFace: "Arial" });
      });

      await pptx.writeFile({ fileName: "healthx-story.pptx" });
    } finally {
      setBusy(null);
    }
  };

  if (pathname === "/login") return null;

  return (
    <div className="no-print fixed right-4 top-4 z-40 flex gap-1.5 rounded-full glass px-2 py-1.5">
      <ToolButton label={theme === "dark" ? "Light mode" : "Dark mode"} onClick={toggleTheme}>
        {theme === "dark" ? "☀️" : "🌙"}
      </ToolButton>
      <ToolButton label="Print / save as PDF" onClick={handlePrint}>
        {busy === "print" ? "…" : "🖨️"}
      </ToolButton>
      <ToolButton label="Download PPT" onClick={handlePpt}>
        {busy === "ppt" ? "…" : "📊"}
      </ToolButton>
    </div>
  );
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors hover:bg-white/10"
    >
      {children}
    </button>
  );
}
