"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      setError("That's not it — try again.");
    } catch {
      setError("Couldn't reach the server — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm p-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/jas-mark.png" alt="" className="h-full w-full scale-[1.7] object-contain" />
        </span>
        <h1 className="font-display mt-4 text-xl font-semibold text-white">
          Healthx <span className="text-grad">Story</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">This dashboard is invite-only.</p>
        <form onSubmit={submit} className="mt-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Access password"
            autoFocus
            className="w-full rounded-full border border-white/10 bg-transparent px-5 py-2.5 text-center text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
          />
          {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || !password}
            className="mt-4 w-full rounded-full border border-cyan-400/60 bg-cyan-400/10 px-5 py-2.5 font-mono text-sm text-cyan-200 transition-opacity disabled:opacity-40"
          >
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>
      </div>
    </main>
  );
}
