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
    nlrMatured: 115.0, // [EDITORIAL] completed-book matured NLR — narrative anchor; not auto-generated
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

// [network, diagnosis group, AED]
// Reclassified June 2026: Z-code "wellness" encounters that are really treatment were
// moved out — chemo & radiation (Z51.0/Z51.11, ~1.0M) → Cancer/Oncology; deliveries &
// antenatal supervision (Z30–Z39, ~1.4M) → Maternity & Newborn. Wellness/Preventive now
// holds only genuine check-ups, screening, immunisation and minor aftercare (~0.8M).
export const diagnosisByNetwork: [string, string, number][] = [
  ["GN", "Musculoskeletal / Joint", 5740156],
  ["GN", "Lifestyle / Metabolic", 5114811],
  ["GN", "Others", 5227168],
  ["GN", "Respiratory", 3860576],
  ["GN", "ENT / Eye / Dental", 3316417],
  ["GN", "Digestive / GI", 3087052],
  ["GN", "Renal / Urinary", 3040881],
  ["GN", "Maternity & Newborn", 2759504],
  ["GN", "Cancer / Oncology", 1483309],
  ["GN", "Cardiovascular", 1726934],
  ["GN", "Autoimmune", 1677480],
  ["GN", "Injuries / Accidents", 1620532],
  ["GN", "Skin / Dermatology", 1323871],
  ["GN", "Wellness / Preventive", 432983],
  ["GN", "Infectious Diseases", 702997],
  ["GN", "Mental Health", 527075],
  ["RN", "Lifestyle / Metabolic", 3211907],
  ["RN", "Others", 2607446],
  ["RN", "Respiratory", 2489064],
  ["RN", "Musculoskeletal / Joint", 2232324],
  ["RN", "Digestive / GI", 1447123],
  ["RN", "Renal / Urinary", 1340088],
  ["RN", "Cancer / Oncology", 1241612],
  ["RN", "Maternity & Newborn", 1149158],
  ["RN", "ENT / Eye / Dental", 1004869],
  ["RN", "Wellness / Preventive", 201057],
  ["RN", "Injuries / Accidents", 645811],
  ["RN", "Cardiovascular", 567115],
  ["RN", "Infectious Diseases", 503000],
  ["RN", "Skin / Dermatology", 487027],
  ["RN", "Autoimmune", 306251],
  ["RN", "Mental Health", 96580],
  ["CN", "Cardiovascular", 1167977],
  ["CN", "Musculoskeletal / Joint", 951867],
  ["CN", "Others", 806227],
  ["CN", "Cancer / Oncology", 588393],
  ["CN", "ENT / Eye / Dental", 511845],
  ["CN", "Lifestyle / Metabolic", 489134],
  ["CN", "Respiratory", 487568],
  ["CN", "Digestive / GI", 420554],
  ["CN", "Renal / Urinary", 333228],
  ["CN", "Autoimmune", 221930],
  ["CN", "Skin / Dermatology", 199500],
  ["CN", "Injuries / Accidents", 187633],
  ["CN", "Mental Health", 171538],
  ["CN", "Maternity & Newborn", 137187],
  ["CN", "Wellness / Preventive", 75499],
  ["CN", "Infectious Diseases", 43864],
  ["SRN", "Lifestyle / Metabolic", 802007],
  ["SRN", "Respiratory", 691129],
  ["SRN", "Others", 687509],
  ["SRN", "Musculoskeletal / Joint", 538662],
  ["SRN", "Maternity & Newborn", 388124],
  ["SRN", "Digestive / GI", 342933],
  ["SRN", "Renal / Urinary", 315008],
  ["SRN", "Autoimmune", 251087],
  ["SRN", "ENT / Eye / Dental", 240906],
  ["SRN", "Wellness / Preventive", 58396],
  ["SRN", "Skin / Dermatology", 172692],
  ["SRN", "Cardiovascular", 141739],
  ["SRN", "Injuries / Accidents", 116635],
  ["SRN", "Infectious Diseases", 82932],
  ["SRN", "Cancer / Oncology", 75735],
  ["SRN", "Mental Health", 16509],
  ["WN", "Lifestyle / Metabolic", 824508],
  ["WN", "Others", 703167],
  ["WN", "Respiratory", 544745],
  ["WN", "Musculoskeletal / Joint", 536141],
  ["WN", "Digestive / GI", 396854],
  ["WN", "Renal / Urinary", 328171],
  ["WN", "ENT / Eye / Dental", 204680],
  ["WN", "Maternity & Newborn", 195173],
  ["WN", "Injuries / Accidents", 191242],
  ["WN", "Cardiovascular", 182953],
  ["WN", "Skin / Dermatology", 116882],
  ["WN", "Infectious Diseases", 77302],
  ["WN", "Autoimmune", 74305],
  ["WN", "Cancer / Oncology", 69995],
  ["WN", "Wellness / Preventive", 51348],
  ["WN", "Mental Health", 17378],
  ["VN", "Lifestyle / Metabolic", 66408],
  ["VN", "Respiratory", 65235],
  ["VN", "Musculoskeletal / Joint", 52477],
  ["VN", "Others", 48227],
  ["VN", "Cardiovascular", 22345],
  ["VN", "Renal / Urinary", 17988],
  ["VN", "Digestive / GI", 17280],
  ["VN", "Skin / Dermatology", 11448],
  ["VN", "Maternity & Newborn", 7780],
  ["VN", "Wellness / Preventive", 6815],
  ["VN", "Infectious Diseases", 6535],
  ["VN", "ENT / Eye / Dental", 5821],
  ["VN", "Autoimmune", 4936],
  ["VN", "Injuries / Accidents", 3473],
  ["VN", "Cancer / Oncology", 2309],
  ["VIP", "Digestive / GI", 46421],
  ["VIP", "Respiratory", 39122],
  ["VIP", "Renal / Urinary", 35957],
  ["VIP", "Cardiovascular", 35336],
  ["VIP", "Maternity & Newborn", 16596],
  ["VIP", "Autoimmune", 5152],
  ["VIP", "Musculoskeletal / Joint", 3047],
  ["VIP", "Others", 1152],
  ["VIP", "Skin / Dermatology", 809],
  ["VD", "ENT / Eye / Dental", 2621],
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
  { code: "GN", label: "General", nlr: 102.0, npM: 34.1 },
  { code: "RN", label: "Restricted", nlr: 94.5, npM: 16.7 },
  { code: "CN", label: "Comprehensive", nlr: 129.5, npM: 5.5 },
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
