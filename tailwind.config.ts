import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05070D",
        panel: "#0B0F1A",
        line: "#1A2235",
        cyan: { glow: "#22D3EE" },
        violet: { glow: "#8B5CF6" },
        emerald: { glow: "#34D399" },
        coral: { glow: "#FB7185" },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
