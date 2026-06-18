"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CountUp from "./CountUp";
import { headline } from "@/data/portfolio";

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".hero-eyebrow", { y: 24, opacity: 0, duration: 0.8, delay: 0.2 })
        .from(".hero-line", { y: 60, opacity: 0, duration: 1, stagger: 0.12 }, "-=0.4")
        .from(".hero-sub", { y: 24, opacity: 0, duration: 0.8 }, "-=0.5")
        .from(".hero-stat", { y: 30, opacity: 0, duration: 0.7, stagger: 0.1 }, "-=0.4")
        .from(".hero-cue", { opacity: 0, duration: 1 }, "-=0.2");

      // parallax orbs drift on scroll
      gsap.to(".orb-a", {
        yPercent: 40,
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(".orb-b", {
        yPercent: -30,
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });

      // hero content gently recedes as the story begins
      gsap.to(".hero-content", {
        opacity: 0.15,
        scale: 0.97,
        scrollTrigger: { trigger: root.current, start: "40% top", end: "bottom top", scrub: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <header ref={root} className="relative min-h-screen flex items-center overflow-hidden">
      {/* ambient glow orbs */}
      <div className="orb-a pointer-events-none absolute -top-32 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-violet-600/20 blur-[120px]" />
      <div className="orb-b pointer-events-none absolute bottom-[-20%] left-[-8%] h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-[120px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px]" />

      <div className="hero-content relative mx-auto w-full max-w-6xl px-6 py-28">
        <p className="hero-eyebrow eyebrow mb-6">
          Wellx · Group insurance portfolio · June 2026
        </p>
        <h1 className="font-display font-bold leading-[1.02] tracking-tight text-[clamp(2.6rem,7vw,5.5rem)] text-white">
          <span className="hero-line block">
            Healthx <span className="text-grad">Story</span>
          </span>
        </h1>
        <p className="hero-line mt-6 font-display text-[clamp(1.3rem,2.6vw,2rem)] font-semibold leading-tight text-slate-200">
          Portfolio performance, insights
          <br />
          &amp; outlook.
        </p>
        <p className="hero-sub mt-7 max-w-xl text-lg text-slate-400">
          Experience, earned in 2024. Predictability, proven in 2025. Scale, unlocked for 2026.
          The story of a book that grew almost 40% while its loss ratio fell 18 points — told
          entirely in our own data.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border hairline sm:grid-cols-3">
          {[
            { v: headline.totals.grossPremiumM, s: "M", d: "AED gross premium written · 2024–26" },
            { v: headline.totals.claimsPaidM, s: "M", d: "AED claims paid · 2024–26" },
            { v: headline.totals.brokers, s: "", d: "broker partners engaged across the book", dec: 0 },
          ].map((x) => (
            <div key={x.d} className="hero-stat glass !rounded-none p-7">
              <div className="font-mono text-4xl text-white">
                <CountUp to={x.v} suffix={x.s} decimals={x.dec ?? 1} />
              </div>
              <div className="mt-1 text-sm text-slate-400">{x.d}</div>
            </div>
          ))}
        </div>

        <div className="hero-cue mt-20 flex items-center gap-3 font-mono text-xs text-slate-500">
          <span className="inline-block h-8 w-px animate-pulse bg-gradient-to-b from-cyan-400 to-transparent" />
          scroll — the story unfolds below
        </div>
      </div>
    </header>
  );
}
