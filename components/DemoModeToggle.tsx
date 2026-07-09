"use client";

// Demo-mode switch. Flipping it sets a cookie and refreshes, so the server
// re-renders every view with client names masked (see lib/demo-mode). Used in
// the home top bar, the dashboard header, and the tracker's ☰ menu.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DEMO_COOKIE } from "@/lib/demo-mode";

const ORANGE = "#fb9b35";

export default function DemoModeToggle({
  initial,
  variant = "pill",
}: {
  initial: boolean;
  variant?: "pill" | "menu";
}) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !on;
    setOn(next);
    document.cookie = `${DEMO_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  const Switch = (
    <span
      aria-hidden
      className="relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors"
      style={{ backgroundColor: on ? ORANGE : "#d7dce6" }}
    >
      <span
        className="inline-block h-3 w-3 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? "translateX(14px)" : "translateX(2px)" }}
      />
    </span>
  );

  if (variant === "menu") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        disabled={pending}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#f5f7fb] disabled:opacity-60"
      >
        <span className="text-[#0b1220]">
          Demo mode
          <span className="block text-[11px] text-[#9aa2b1]">Hide client names</span>
        </span>
        {Switch}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={pending}
      title="Hide client names for demos"
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60"
      style={
        on
          ? { borderColor: ORANGE, backgroundColor: "#fff6ec", color: "#b5560a" }
          : { borderColor: "#e2e6ee", backgroundColor: "#fff", color: "#5b6472" }
      }
    >
      {Switch}
      {on ? "Names hidden" : "Demo mode"}
    </button>
  );
}
