"use client";

import { useRouter } from "next/navigation";

// Makes an entire table row open a renewal on click (keeps the page server-rendered).
export default function ClickableRow({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <tr onClick={() => router.push(href)} className={`cursor-pointer ${className ?? ""}`}>
      {children}
    </tr>
  );
}
