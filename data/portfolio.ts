// Real figures pulled from the Wellx Policy Database (Supabase).
// ┌─────────────────────────────────────────────────────────────────────────┐
// │ Data-derived numbers come from GEN (data/generated.ts), produced by      │
// │ scripts/refresh/generate.mjs. To refresh after a TRR/claims update, run  │
// │ that generator — DO NOT hand-edit the GEN-sourced values below.          │
// │ Everything NOT sourced from GEN here is editorial (labels, narrative     │
// │ anchors like nlrMatured, the diagnosis-group mapping, hints, actions,    │
// │ network NLRs, inflation) and is owned by hand. See scripts/refresh/.     │
// └─────────────────────────────────────────────────────────────────────────┘
import { GEN } from "./generated";

export const headline = {
  completed: {
    label: "Completed policies",
    sub: "expired >90 days before snapshot · 133 contracts · 5,318 lives",
    netLR: 115.0,
    grossLR: 79.4,
    gp: 33.0,
    np: 22.8,
    paid: 26.2,
    takeRate: 30.9, // 1 - (net premium / gross premium)
    gpPerMember: 6203,
    npPerMember: 4286,
    claimsPerMember: 4928,
  },
  uy2024: {
    label: "UY 2024 policies (all)",
    sub: "still developing · 308 contracts · 9,874 lives",
    netLR: 103.4,
    grossLR: 73.1,
    gp: 61.1,
    np: 43.2,
    paid: 44.7,
    takeRate: 29.3, // 1 - (net premium / gross premium)
  },
  // [GEN] Whole-book totals across all three underwriting years, from the TRR.
  // brokers consolidated across name variants; excludes direct sales & individual contracts.
  totals: GEN.totals,
};

// The arc — UY2024 → UY2025 → UY2026, recomputed from trr + claims (June 2026).
// Projected LR: (paid + 85% × outstanding) annualised per policy ÷ premium.
// Groups are consolidated across name variants — benefit-band suffixes (LSB/NLSB/HSB),
// emirate branches (AUH/DXB/Abu Dhabi/Dubai), legal-form punctuation, and brand families.
// Cohorts: consolidated UY2024 groups split by paid NLR ≤/> 100% at the 30-Sep-2025 snapshot.
export const arc = {
  y2024: {
    gp: GEN.y2024.gp,
    lives: GEN.y2024.lives,
    groups: GEN.y2024.groups, // consolidated across name variants
    nlrMatured: 114.0, // [EDITORIAL] 2024 book projected NLR — narrative anchor; refresh by hand
    avgPremium: GEN.y2024.avgPremium,
  },
  y2025: {
    gp: GEN.y2025.gp,
    np: GEN.y2025.np,
    lives: GEN.y2025.lives,
    groups: GEN.y2025.groups,
    nlrProjected: GEN.y2025.nlrProjected,
    glrProjected: GEN.y2025.glrProjected,
    takeRate: GEN.y2025.takeRate,
    avgPremium: GEN.y2025.avgPremium,
    renewalGp: GEN.y2025.renewalGp,
    newGp: GEN.y2025.newGp,
    gpGrowthPct: GEN.y2025.gpGrowthPct,
    livesGrowthPct: GEN.y2025.livesGrowthPct,
    avgPremiumGrowthPct: GEN.y2025.avgPremiumGrowthPct,
  },
  // [GEN] Renewal by UY2024 gross premium written (AED M). Performing = paid NLR ≤ 100%.
  // For the loss-making cohort, "removed" = premium not renewed, "kept" = premium renewed.
  cohorts: {
    good: { label: "Performing book", ...GEN.cohorts.good },
    bad: {
      label: "Loss-making book",
      groups: GEN.cohorts.bad.groups,
      renewedGroups: GEN.cohorts.bad.renewedGroups,
      gpTotal: GEN.cohorts.bad.gpTotal,
      gpRemoved: GEN.cohorts.bad.gpLost,
      gpKept: GEN.cohorts.bad.gpRenewed,
    },
  },
  // [GEN] gross premium written per inception month, AED millions
  monthlyGp2024: GEN.monthlyGp2024,
  monthlyGp2025Renewal: GEN.monthlyGp2025Renewal,
  monthlyGp2025New: GEN.monthlyGp2025New,
  q1Trend: GEN.q1Trend,
};

// Census — distinct members observed in the claims database (one row per pseudonymised
// member_id). The policy_members admin table only covers 96 onboarded policies (~2.7k
// members) and badly undercounts the book; this is the widest member-level view we have.
// "active" = members on a policy still in force at the June 2026 snapshot
// (policy effective month within the trailing 12 months).
// Nationality groups: Indian subcontinent = IN/PK/LK/NP/BD/AF/BT · Arab = Arab League
// members · Rest of Asia incl. PH/IR/CN/TR/Central Asia · Europe incl. UK/RU/UA.
export type CensusSlice = {
  total: number;
  gender: { label: string; value: number; pct: number }[];
  relation: { label: string; value: number; pct: number }[];
  age: { label: string; value: number; pct: number }[];
  nationality: { label: string; value: number; pct: number }[];
};

// [GEN] all = distinct members in claims; active = in-force lives (TRR), demographic
// mix estimated from active claimants and scaled to the in-force headcount. The GEN
// census uses `nat`; we surface it as `nationality` to match the component shape.
const censusSlice = (s: typeof GEN.census.all): CensusSlice => ({
  total: s.total,
  gender: s.gender,
  relation: s.relation,
  age: s.age,
  nationality: s.nat,
});
export const census: Record<"all" | "active", CensusSlice> = {
  all: censusSlice(GEN.census.all),
  active: censusSlice(GEN.census.active),
};

// [GEN] Combined claims story — sliceable by network. Amounts are payer_share AED;
// episodes = distinct visit_episode; provider groups consolidated across entities.
// censusRelationPct (the claims-vs-census mirror) is derived from the GEN census.
export const claimsStory = {
  episodes: GEN.claims.episodes,
  censusRelationPct: Object.fromEntries(
    GEN.census.all.relation.map((r) => [r.label, r.pct])
  ) as Record<string, number>,
  fobByNetwork: GEN.claims.fobByNetwork,
  relationByNetwork: GEN.claims.relationByNetwork,
  providersByNetwork: GEN.claims.providersByNetwork,
};

// VIP (Value IP) and VD (VN dental) roll up into VN — the explorer normalises
// raw data rows carrying those codes into "Value".
export const networks: [string, string][] = [
  ["GN", "General"],
  ["RN", "Restricted"],
  ["CN", "Comprehensive"],
  ["SRN", "Super-restricted"],
  ["WN", "Workers"],
  ["VN", "Value"],
];

// [network, diagnosis group, AED] — re-derived June 2026 from a codified ICD mapping.
// Endocrine + hypertension (I10–I16) → Lifestyle/Metabolic; RA/psoriasis/IBD/lupus/MS
// → Autoimmune; chemo & radiation (Z51.0/Z51.1) → Cancer/Oncology; deliveries & antenatal
// (Z30–Z39) → Maternity; Z-code check-ups → Wellness; symptoms/R-codes & unclassified → Others.
export const diagnosisByNetwork: [string, string, number][] = [
  ["CN", "Cardiovascular", 1206335],
  ["CN", "Musculoskeletal / Joint", 1173573],
  ["CN", "Others", 1026460],
  ["CN", "Digestive / GI", 779644],
  ["CN", "Cancer / Oncology", 727307],
  ["CN", "Respiratory", 606428],
  ["CN", "Lifestyle / Metabolic", 561834],
  ["CN", "Renal / Urinary", 450373],
  ["CN", "ENT / Eye / Dental", 433071],
  ["CN", "Autoimmune", 277882],
  ["CN", "Maternity & Newborn", 267829],
  ["CN", "Skin / Dermatology", 249049],
  ["CN", "Injuries / Accidents", 246581],
  ["CN", "Mental Health", 204190],
  ["CN", "Wellness / Preventive", 100002],
  ["CN", "Infectious Diseases", 70667],
  ["GN", "Others", 8187596],
  ["GN", "Musculoskeletal / Joint", 7873828],
  ["GN", "Lifestyle / Metabolic", 6894820],
  ["GN", "Digestive / GI", 6398490],
  ["GN", "Respiratory", 5560399],
  ["GN", "Renal / Urinary", 4621062],
  ["GN", "Maternity & Newborn", 3840286],
  ["GN", "ENT / Eye / Dental", 2852322],
  ["GN", "Cancer / Oncology", 2405789],
  ["GN", "Cardiovascular", 2386400],
  ["GN", "Autoimmune", 2278979],
  ["GN", "Injuries / Accidents", 2106793],
  ["GN", "Skin / Dermatology", 1960100],
  ["GN", "Infectious Diseases", 1122207],
  ["GN", "Mental Health", 735482],
  ["GN", "Wellness / Preventive", 695114],
  ["RN", "Lifestyle / Metabolic", 4490140],
  ["RN", "Others", 4104297],
  ["RN", "Respiratory", 3658293],
  ["RN", "Musculoskeletal / Joint", 3222119],
  ["RN", "Digestive / GI", 2910874],
  ["RN", "Renal / Urinary", 1987140],
  ["RN", "Cancer / Oncology", 1824190],
  ["RN", "Maternity & Newborn", 1802380],
  ["RN", "Cardiovascular", 903384],
  ["RN", "Injuries / Accidents", 875347],
  ["RN", "ENT / Eye / Dental", 860796],
  ["RN", "Skin / Dermatology", 820148],
  ["RN", "Infectious Diseases", 726609],
  ["RN", "Autoimmune", 604830],
  ["RN", "Wellness / Preventive", 353163],
  ["RN", "Mental Health", 126028],
  ["SRN", "Lifestyle / Metabolic", 1077331],
  ["SRN", "Respiratory", 1052155],
  ["SRN", "Others", 1039198],
  ["SRN", "Musculoskeletal / Joint", 784965],
  ["SRN", "Digestive / GI", 586240],
  ["SRN", "Maternity & Newborn", 537473],
  ["SRN", "Renal / Urinary", 505938],
  ["SRN", "Autoimmune", 336946],
  ["SRN", "Skin / Dermatology", 221139],
  ["SRN", "Injuries / Accidents", 217215],
  ["SRN", "ENT / Eye / Dental", 180399],
  ["SRN", "Cardiovascular", 175323],
  ["SRN", "Infectious Diseases", 136907],
  ["SRN", "Wellness / Preventive", 82030],
  ["SRN", "Cancer / Oncology", 68028],
  ["SRN", "Mental Health", 19449],
  ["VD", "Digestive / GI", 3188],
  ["VIP", "Digestive / GI", 82327],
  ["VIP", "Renal / Urinary", 41375],
  ["VIP", "Respiratory", 39122],
  ["VIP", "Cardiovascular", 35336],
  ["VIP", "Maternity & Newborn", 16596],
  ["VIP", "Musculoskeletal / Joint", 7458],
  ["VIP", "Autoimmune", 5152],
  ["VIP", "Others", 1152],
  ["VIP", "Skin / Dermatology", 809],
  ["VN", "Respiratory", 90612],
  ["VN", "Lifestyle / Metabolic", 89936],
  ["VN", "Others", 82687],
  ["VN", "Musculoskeletal / Joint", 66208],
  ["VN", "Renal / Urinary", 26282],
  ["VN", "Digestive / GI", 23306],
  ["VN", "Cardiovascular", 22592],
  ["VN", "Skin / Dermatology", 16810],
  ["VN", "Infectious Diseases", 10672],
  ["VN", "Maternity & Newborn", 9883],
  ["VN", "Wellness / Preventive", 9074],
  ["VN", "ENT / Eye / Dental", 7488],
  ["VN", "Autoimmune", 5257],
  ["VN", "Injuries / Accidents", 4796],
  ["VN", "Cancer / Oncology", 2845],
  ["VN", "Mental Health", 29],
  ["WN", "Lifestyle / Metabolic", 1294085],
  ["WN", "Others", 1095239],
  ["WN", "Respiratory", 951812],
  ["WN", "Musculoskeletal / Joint", 849721],
  ["WN", "Digestive / GI", 682082],
  ["WN", "Renal / Urinary", 556694],
  ["WN", "Cardiovascular", 434981],
  ["WN", "Maternity & Newborn", 411615],
  ["WN", "ENT / Eye / Dental", 335148],
  ["WN", "Cancer / Oncology", 256194],
  ["WN", "Injuries / Accidents", 228133],
  ["WN", "Skin / Dermatology", 190611],
  ["WN", "Infectious Diseases", 144773],
  ["WN", "Autoimmune", 130882],
  ["WN", "Wellness / Preventive", 103298],
  ["WN", "Mental Health", 18780],
];

export const groupHints: Record<string, string> = {
  "Lifestyle / Metabolic": "Diabetes, hypertension, cholesterol — T2 diabetes alone ≈ 4.1M AED",
  "Musculoskeletal / Joint": "Arthritis, back pain, joint work",
  Others: "Mostly R-codes: diagnostics & consults without a final diagnosis",
  "Cancer / Oncology": "Incl. ~1.0M chemo & radiation encounters reclassified out of Z-codes",
  "Maternity & Newborn": "Incl. ~1.4M deliveries & antenatal care reclassified out of Z-codes",
  "Wellness / Preventive": "Genuine check-ups, screening & immunisation only — chemo & deliveries moved to Oncology & Maternity",
  Autoimmune: "RA, psoriasis, IBD — mapped at diagnosis level",
};

export const actions = [
  {
    title: "Reprice GN",
    body: "General Network carries AED 34M of net premium — over half the book — at a projected 102% NLR. The 2026 renewal round starts here.",
  },
  {
    title: "Offer GN minus the big four",
    body: "A General Network plan excluding Mediclinic, Medcare, Al Zahra & KCH — full network breadth without the four most expensive cost-per-episode providers in the book.",
  },
  {
    title: "Double down on chronic care",
    body: "Lifestyle & metabolic conditions top the claims table. Scale the Chronic Disease Management Program for the 1,100+ hypertensive and diabetic members — this is where the curve bends.",
  },
];

// Projected UY2025 NLR by network. Premium allocated to networks per group using
// member counts weighted by network premium rates (rates derived from single-network
// groups); network-tagged claims (paid + 85% OS) annualised per group; calibrated so
// the book rolls up to the headline 101.0% projection.
export const networkNlr2025 = [
  { code: "GN", label: "General", nlr: 102.6, npM: 34.1 },
  { code: "RN", label: "Restricted", nlr: 96.3, npM: 16.7 },
  { code: "CN", label: "Comprehensive", nlr: 129.3, npM: 5.5 },
];

// Medical inflation — same-service price comparison from our own claims: cells are
// benefit × ICD chapter, priced as payer share per episode, weighted by base-year
// spend, cells with ≥30 episodes both years. 2025 = full-year 2024 vs 2025 (32 cells,
// 21.1M base). 2026 = Jan–May 2026 vs Jan–May 2025 (24 cells, 3.7M base) — an early
// read; the negative number tracks provider steering, not market deflation.
export const inflation = {
  y2025: { pct: 11.4 },
  y2026: { pct: -8.5 },
};
