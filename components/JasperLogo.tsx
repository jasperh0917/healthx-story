// Jasper logo lockup — the Wellx ribbon mark + "JASPER" wordmark (Raleway) +
// "AI Underwriter" sub-label (Inter, Wellx Slate). Matches the brand design doc.
// Works on light surfaces (black wordmark) or dark (white wordmark).

const SIZES = {
  sm: { mark: 26, word: 19, sub: 8, gap: 11, div: 22 },
  md: { mark: 40, word: 30, sub: 9.5, gap: 16, div: 34 },
  lg: { mark: 66, word: 50, sub: 12.5, gap: 22, div: 56 },
} as const;

const SLATE = "#5E788A"; // Wellx Slate — the sub-label colour

export default function JasperLogo({
  variant = "light",
  size = "md",
  showSub = true,
}: {
  variant?: "light" | "dark";
  size?: keyof typeof SIZES;
  showSub?: boolean;
}) {
  const s = SIZES[size];
  const word = variant === "dark" ? "#ffffff" : "#000000";
  const divider = variant === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)";

  return (
    <span className="inline-flex items-center" style={{ gap: s.gap }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/jasper-mark.png" alt="Wellx" style={{ height: s.mark, width: "auto", display: "block" }} />
      <span style={{ width: 1.5, height: s.div, background: divider, flexShrink: 0 }} />
      <span className="inline-flex flex-col" style={{ gap: 3 }}>
        <span
          style={{
            fontFamily: "Raleway, sans-serif",
            fontWeight: 800,
            fontSize: s.word,
            lineHeight: 0.9,
            letterSpacing: "-0.01em",
            color: word,
          }}
        >
          JASPER
        </span>
        {showSub && (
          <span
            style={{
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              fontSize: s.sub,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: SLATE,
            }}
          >
            AI Underwriter
          </span>
        )}
      </span>
    </span>
  );
}
