# Data refresh pipeline

When the **TRR** or **claims** tables in Supabase are refreshed, the dashboard does
**not** update on its own — every data-derived number is baked into
[`data/generated.ts`](../../data/generated.ts). This pipeline regenerates that file.

```
Supabase (TRR + claims)
        │   refresh.sql logic  (consolidation · projection · census · claims)
        ▼
scripts/refresh/generate.mjs
        │   writes
        ▼
data/generated.ts  (the GEN object)
        │   imported by
        ▼
data/portfolio.ts  →  components  →  dashboard
```

## What is auto-generated vs. hand-owned

| Auto-generated (GEN → never hand-edit) | Editorial (in `portfolio.ts`, owned by hand) |
|---|---|
| Headline totals (GWP, paid, brokers, …) | All narrative / headlines / ledes (`app/page.tsx`, `Hero.tsx`) |
| Arc y2024 / y2025 core + growth %s | `arc.y2024.nlrMatured` (the **115%** story anchor) |
| Cohort renewal premium splits | `diagnosisByNetwork` (the 16-group mapping + chemo/maternity reclassification) |
| Monthly GP arrays, Q1 trend | `networkNlr2025` (GN/RN/CN — tuned allocation) |
| Census (all + active, scaled) | `inflation`, `groupHints`, `actions`, `networks` labels, cohort labels |
| Claims by benefit / relation / provider | CDMP model & the PDF/XLSX exports |

The editorial figures are deliberately excluded because they encode judgement the
data can't reproduce (e.g. the matured-book cohort behind 115%, the diagnosis
grouping rules that predate this pipeline). They are clearly marked `[EDITORIAL]`
in `portfolio.ts`.

## How to refresh

### Option A — live database (recommended, one command)

```bash
npm i pg          # one-time
SUPABASE_DB_URL='postgres://postgres:[PASSWORD]@db.<ref>.supabase.co:5432/postgres' \
  node scripts/refresh/generate.mjs
```

Get the connection string from **Supabase → Project Settings → Database →
Connection string (URI)**. The generator runs four fast queries and rewrites
`data/generated.ts`.

### Option B — no database access (SQL editor)

1. Open `scripts/refresh/refresh.sql`, run it in the **Supabase SQL editor**.
2. Copy the single `snapshot` JSON cell into `scripts/refresh/snapshot.json`.
3. `node scripts/refresh/generate.mjs --from-snapshot`

## After running — REVIEW THE DIFF

The generator prints a one-line sanity check (GWP / NLR / active lives). Then:

```bash
git diff data/generated.ts        # confirm the numbers moved as expected
npx tsc --noEmit                  # must pass
npm run dev                       # eyeball the dashboard
```

**Important:** if a headline number moved materially, the *prose* may now be wrong
(it's hand-written). Re-read these against the new numbers and edit by hand:

- Hero: "grew almost 40% while its loss ratio fell 14 points"
- Arc ledes: "115% → 101%", "84% of loss-making premium removed", "77% … performing"
- Risk-pool lede: "61% are 26–45", "break-even"
- Outlook: the GN/RN/CN NLR tiles are editorial — recompute `networkNlr2025` separately
  (helper logic is in this folder's git history) if the book shifts.

Also refresh `nlrMatured`, `diagnosisByNetwork`, and `networkNlr2025` by hand when the
underlying data changes enough to matter — they are not in the generator.

## Files

| File | Purpose |
|---|---|
| `generate.mjs` | The generator (live DB or `--from-snapshot`). Writes `data/generated.ts`. |
| `refresh.sql` | Manual fallback: one query → `snapshot.json`. |
| `snapshot.json` | Last snapshot input (kept for reference / Option B). |
