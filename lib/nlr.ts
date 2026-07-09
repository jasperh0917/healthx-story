// NLR tier classification (shared by the tracker filter and any badges).
export const NLR_TIERS = [
  "Highly Profitable",
  "Profitable",
  "Marginal / Borderline",
  "Breakeven to Technical Loss",
  "Loss-making",
  "Heavily Loss-making",
] as const;

export type NlrTier = (typeof NLR_TIERS)[number];

export function nlrTier(n: number | null): NlrTier | null {
  if (n == null) return null;
  if (n < 0.85) return "Highly Profitable";
  if (n < 0.9) return "Profitable";
  if (n < 0.95) return "Marginal / Borderline";
  if (n <= 1.0) return "Breakeven to Technical Loss";
  if (n <= 1.2) return "Loss-making";
  return "Heavily Loss-making";
}
