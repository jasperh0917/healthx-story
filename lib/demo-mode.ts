// ─────────────────────────────────────────────────────────────────────────────
// Demo mode — pure helpers (no server imports; safe for client + server).
//
// When demo mode is on, real client/company names are replaced with stable,
// realistic-looking pseudonyms so the app can be screen-shared without exposing
// WellX's clients. Masking happens SERVER-SIDE (in the data layer) so real names
// never reach the browser. The alias is a deterministic function of a stable key
// (e.g. master_key), so the same company shows the SAME pseudonym on every view.
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_COOKIE = "jasper_demo";

// FNV-1a 32-bit — small, fast, deterministic.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PREFIX = [
  "Meridian", "Cedar", "Falcon", "Orion", "Vantage", "Summit", "Harbour", "Zenith",
  "Beacon", "Crescent", "Pioneer", "Atlas", "Nova", "Sterling", "Onyx", "Quartz",
  "Cobalt", "Marlin", "Sable", "Verdant", "Halcyon", "Cirrus", "Keystone", "Solstice",
  "Camden", "Delta", "Ember", "Aurora", "Basalt", "Cadence", "Dune", "Emerald",
  "Fenwick", "Granite", "Horizon", "Indigo", "Juniper", "Kestrel", "Lumen", "Mistral",
  "Nimbus", "Obelisk", "Peregrine", "Ridgeline", "Sapphire", "Tamarind", "Umbra", "Vesper",
];

// A middle word widens the namespace enough that ~640 groups almost never
// collide, while still reading like a real company name ("Cedar Gulf Trading").
const MIDDLE = [
  "Gulf", "Emirates", "National", "United", "Prime", "First", "Metro", "Pearl",
  "Crystal", "Royal", "Star", "Continental", "Union", "Central", "Coastal", "Highland",
  "Eastern", "Western", "Premier", "Apex", "Regional", "Meridian",
];

const SUFFIX = [
  "Group", "Holdings", "Trading", "Industries", "Partners", "Enterprises", "Solutions",
  "Ventures", "Global", "Corporation", "Investments", "Logistics", "Medical", "Health",
  "Consultants", "Contracting", "General Trading", "FZE", "LLC", "Trading Co", "Capital", "Resources",
];

const BROKER_SUFFIX = [
  "Insurance Brokers", "Brokers", "Risk Partners", "Insurance Services",
  "Reinsurance", "Advisory", "Insurance Brokerage", "Risk Solutions",
];

const pick = <T,>(arr: T[], h: number, place: number): T =>
  arr[Math.floor(h / place) % arr.length];

/** Stable company pseudonym for a client/group, keyed on a stable id. */
export function demoAlias(key: string | null | undefined): string {
  const h = hash(`grp:${key ?? ""}`);
  const p = PREFIX[h % PREFIX.length];
  const m = pick(MIDDLE, h, PREFIX.length);
  const s = pick(SUFFIX, h, PREFIX.length * MIDDLE.length);
  return `${p} ${m} ${s}`;
}

/** Stable broker pseudonym, keyed on the raw broker string. */
export function demoBrokerAlias(key: string | null | undefined): string {
  const h = hash(`brk:${key ?? ""}`);
  const p = PREFIX[h % PREFIX.length];
  const m = pick(MIDDLE, h, PREFIX.length);
  const s = pick(BROKER_SUFFIX, h, PREFIX.length * MIDDLE.length);
  return `${p} ${m} ${s}`;
}
