"use client";

import Link from "next/link";
import { unsaved } from "@/lib/unsaved";

// A back link that warns if the renewal form has unsaved edits.
export default function GuardedBackLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (unsaved.dirty && !window.confirm("You have unsaved changes. Leave without saving?")) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Link>
  );
}
