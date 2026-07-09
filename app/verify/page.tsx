"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function VerifyInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (code.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    if (!email) {
      setError("Email missing — go back and request a new code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: vErr } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (vErr || !data.user) {
        setError("Wrong or expired code. Try again, or request a new one.");
        setBusy(false);
        return;
      }
      router.replace("/");
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="glass w-full max-w-sm p-8 text-center">
        <h1 className="font-display text-xl font-semibold text-white">Enter your code</h1>
        <p className="mt-1 text-sm text-slate-400">
          Sent to <span className="text-slate-200">{email || "your email"}</span>.
        </p>
        <form onSubmit={submit} className="mt-6">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="••••••"
            autoFocus
            className="w-full rounded-full border border-white/10 bg-transparent px-5 py-2.5 text-center text-lg tracking-[0.4em] text-slate-200 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
          />
          {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="mt-4 w-full rounded-full border border-cyan-400/60 bg-cyan-400/10 px-5 py-2.5 font-mono text-sm text-cyan-200 transition-opacity disabled:opacity-40"
          >
            {busy ? "Verifying…" : "Verify"}
          </button>
        </form>
        <Link href="/login" className="mt-4 inline-block text-xs text-slate-500 hover:text-slate-300">
          ← Use a different email
        </Link>
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
