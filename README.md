# Wellx Pulse — Portfolio Performance Story

A cinematic, scroll-driven data story: "How Our Insurance Portfolio Performed — Insights & Outlook."
Dark luxury fintech aesthetic · Next.js 15 (App Router) · TypeScript · Tailwind · GSAP ScrollTrigger · Framer Motion · Lenis smooth scroll.

## Run it (2 commands)

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## What's inside

- `app/page.tsx` — the five-act story (headline LR → census → claims flow → diagnosis drivers → outlook)
- `data/portfolio.ts` — ALL the numbers live here. Real figures from the Wellx Policy Database (Supabase), June 2026 snapshot. To refresh the data, only this file changes.
- `components/Hero.tsx` — GSAP intro timeline + parallax glow orbs
- `components/SmoothScroll.tsx` — Lenis + GSAP ScrollTrigger sync
- `components/Story.tsx` — section shell + animated bar charts (Framer Motion)
- `components/DiagnosisExplorer.tsx` — 16 diagnosis groups, network multi-select chips, tap-for-insight toasts

## For Claude Code (next steps)

1. **Live data**: replace the static `data/portfolio.ts` with a Supabase query (project: Policy Database). Aggregate server-side in a Route Handler; keep the same shapes so components don't change. Enable RLS + a read-only role first.
2. **Deploy**: `vercel` — it's a static build, deploys in one step.
3. **Known data gaps** (carry into any live version): trr has no outstanding-claims column (LRs are paid-only); gender/relation/age fields need normalisation at source.

## Notes

- Respects `prefers-reduced-motion` (Lenis + animations disabled).
- Responsive down to mobile.
- Fonts load from Google Fonts at runtime (Sora / Inter / JetBrains Mono).
