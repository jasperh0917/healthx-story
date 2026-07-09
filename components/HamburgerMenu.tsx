"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import DemoModeToggle from "@/components/DemoModeToggle";

const NAVY = "#b5560a"; // WellX orange ink (was navy) — menu link text

// Top-right menu. Holds "Manage groups" (head only), the Dashboard link, and the
// demo-mode switch.
export default function HamburgerMenu({ isHead, demoInitial }: { isHead: boolean; demoInitial: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e2e6ee] text-[#0b1220] transition-colors hover:border-[#c7cdd9]"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-[2px] w-4 bg-current" />
          <span className="block h-[2px] w-4 bg-current" />
          <span className="block h-[2px] w-4 bg-current" />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-[#e6e9f0] bg-white py-1 shadow-[0_16px_40px_-14px_rgba(15,23,42,0.4)]">
          {isHead && (
            <>
              <Link
                href="/renewals/groups"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm hover:bg-[#f5f7fb]"
                style={{ color: NAVY }}
              >
                Manage Policies
              </Link>
              <Link
                href="/renewals/brokers"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm hover:bg-[#f5f7fb]"
                style={{ color: NAVY }}
              >
                Manage Brokers
              </Link>
            </>
          )}
          <Link
            href="/renewals/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-sm hover:bg-[#f5f7fb]"
            style={{ color: NAVY }}
          >
            Renewal Dashboard
          </Link>
          <div className="my-1 border-t border-[#eef1f6]" />
          <DemoModeToggle initial={demoInitial} variant="menu" />
        </div>
      )}
    </div>
  );
}
