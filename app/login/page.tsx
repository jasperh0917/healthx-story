"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import JasperLogo from "@/components/JasperLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInErr) {
        setError(
          /invalid login|credentials/i.test(signInErr.message)
            ? "Wrong email or password."
            : "Couldn't sign you in — please try again.",
        );
        setBusy(false);
        return;
      }
      router.replace("/");
    } catch {
      setError("Couldn't reach the server — try again.");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm p-8 text-center">
        <div className="flex justify-center">
          <JasperLogo variant="dark" size="md" />
        </div>
        <p className="mt-5 text-sm text-slate-400">Underwriting team only. Sign in to continue.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@wellxai.com"
            autoFocus
            className="w-full rounded-full border border-white/10 bg-transparent px-5 py-2.5 text-center text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
          />
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-full border border-white/10 bg-transparent px-5 py-2.5 text-center text-sm text-slate-200 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
          />
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || !email || !password}
            className="w-full rounded-full border border-cyan-400/60 bg-cyan-400/10 px-5 py-2.5 font-mono text-sm text-cyan-200 transition-opacity disabled:opacity-40"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
