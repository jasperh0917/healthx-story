"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Why is the projected NLR 101%?",
  "Which network is burning and why?",
  "How was medical inflation measured?",
];

/** Wellx ribbon mark (public/jas-mark.png) — the source asset has generous
    padding, so it renders scaled up inside an overflow-hidden frame. */
function JasMark({ className }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center overflow-hidden ${className ?? ""}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/jas-mark.png" alt="" className="h-full w-full scale-[1.7] object-contain" />
    </span>
  );
}

export default function Jas() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking, open]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/jas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: data.reply ?? "Something went wrong — try again." }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "I couldn't reach the server — try again." }]);
    } finally {
      setThinking(false);
    }
  };

  if (pathname === "/login") return null;

  return (
    <div className="no-print">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="glass fixed bottom-24 right-4 z-50 flex h-[min(34rem,70vh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b hairline px-5 py-3.5">
              <JasMark className="h-8 w-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold leading-snug text-white">
                  Hello, I am Jas! How can I help you today?
                </p>
                <p className="font-mono text-[10px] text-slate-500">this portfolio&apos;s story only</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-slate-500 transition-colors hover:text-slate-300">
                ✕
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div>
                  <div className="flex flex-col gap-2">
                    {SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        onClick={() => send(sug)}
                        className="rounded-xl border border-white/10 px-3 py-2 text-left text-[12px] text-slate-400 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                      m.role === "user"
                        ? "bg-cyan-400/15 text-slate-200"
                        : "bg-white/5 text-slate-300"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-white/5 px-3.5 py-2.5 font-mono text-[12px] text-slate-500">
                    <span className="animate-pulse">crunching the numbers…</span>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t hairline p-3"
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the story…"
                  className="min-w-0 flex-1 rounded-full border border-white/10 bg-transparent px-4 py-2 text-[13px] text-slate-200 placeholder:text-slate-600 focus:border-cyan-400/50 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={thinking || !input.trim()}
                  className="rounded-full border border-cyan-400/60 bg-cyan-400/10 px-4 py-2 font-mono text-xs text-cyan-200 transition-opacity disabled:opacity-40"
                >
                  Ask
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat with Jas"
        className="glass glow-cyan fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full text-slate-400"
      >
        <JasMark className="h-9 w-9" />
      </motion.button>
    </div>
  );
}
