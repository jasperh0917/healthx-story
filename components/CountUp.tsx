"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

type Props = {
  to: number;
  suffix?: string;
  decimals?: number;
  className?: string;
};

export default function CountUp({ to, suffix = "", decimals = 1, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 1.6, bounce: 0 });

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) {
        const formatted =
          decimals === 0 ? Math.round(v).toLocaleString() : v.toFixed(decimals);
        ref.current.textContent = formatted + suffix;
      }
    });
  }, [spring, suffix, decimals]);

  return (
    <span ref={ref} className={className}>
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  );
}
