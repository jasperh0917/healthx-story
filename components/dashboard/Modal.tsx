"use client";

// Lightweight, dependency-free modal. Closes on backdrop click, the ✕ button,
// or Escape. Locks body scroll while open.
import { useEffect } from "react";

export default function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0b1220]/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e6e9f0] bg-white shadow-[0_30px_80px_-20px_rgba(15,23,42,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-[#eef1f6] px-6 py-4">
          <div>
            <h2 style={{ fontFamily: "Raleway, sans-serif" }} className="text-lg font-bold tracking-tight text-[#0b1220]">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#9aa2b1]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 flex h-8 w-8 items-center justify-center rounded-full text-[#9aa2b1] transition-colors hover:bg-[#f5f7fb] hover:text-[#0b1220]"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
