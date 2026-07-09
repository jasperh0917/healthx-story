// Money formatting shared across the dashboard cards.

/** Full AED with thousands separators — "AED 1,240,000". */
export function aed(n: number): string {
  return `AED ${Math.round(n).toLocaleString("en-US")}`;
}

/** Compact AED for big headline figures — "AED 1.24M" / "AED 640K". */
export function aedShort(n: number): string {
  if (!n) return "AED 0";
  if (Math.abs(n) >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `AED ${Math.round(n / 1_000)}K`;
  return `AED ${Math.round(n)}`;
}

/** Percent share of a whole — "34%". */
export function pct(part: number, whole: number): string {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

/** A ratio (0.96 / 1.05) as a percent — "96%" / "105%". Dash if no base. */
export function ratioPct(ratio: number | null): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return `${Math.round(ratio * 100)}%`;
}
