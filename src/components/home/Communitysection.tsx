"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const STATS = [
  { value: "9", label: "countries" },
  { value: "20+", label: "languages" },
  { value: "MIT", label: "licensed" },
  { value: "∞", label: "audit trail" },
];

const LINKS = [
  {
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
      </svg>
    ),
    label: "Star on GitHub",
    sub: "Follow development",
    href: "https://github.com/o-lang",
    color: "hover:border-white/30 hover:bg-white/[0.07]",
    iconColor: "text-white/60 group-hover:text-white",
    labelColor: "text-white/85 group-hover:text-white",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
      </svg>
    ),
    label: "Join Discord",
    sub: "Talk to the builders",
    href: "https://discord.gg/olang",
    color: "hover:border-indigo-400/40 hover:bg-indigo-500/[0.10]",
    iconColor: "text-indigo-300/70 group-hover:text-indigo-300",
    labelColor: "text-white/85 group-hover:text-indigo-200",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-5 h-5">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    label: "Read the Docs",
    sub: "Full API reference",
    href: "/docs",
    color: "hover:border-emerald-400/40 hover:bg-emerald-500/[0.08]",
    iconColor: "text-emerald-400/70 group-hover:text-emerald-300",
    labelColor: "text-white/85 group-hover:text-emerald-200",
  },
];

export function CommunitySection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setStatus("success");
      setMessage("You're on the list. We'll be in touch.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  };

  return (
    <section
      id="community"
      className="py-24 px-[5%] border-t border-slate-900 bg-slate-950"
    >
      <div className="max-w-[900px] mx-auto">

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mb-10"
        >
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="font-syne text-[36px] font-extrabold text-slate-100 tracking-[-1px] leading-none">{value}</p>
              <p className="font-mono text-[11px] text-slate-500 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
          <div className="hidden md:block w-px h-10 bg-slate-800" />
          <div className="text-center">
            <p className="font-syne text-[15px] font-semibold text-slate-300 leading-snug max-w-[200px]">
              Forged in Africa.<br />Scaled Globally.
            </p>
          </div>
        </motion.div>

        {/* Main CTA block */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[24px] overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl shadow-black/50"
        >
          <div className="grid md:grid-cols-2 gap-0">

            {/* Left — Email capture */}
            <div className="p-10 border-b md:border-b-0 md:border-r border-slate-800">
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-mono text-[11px] text-amber-400 tracking-[0.3px]">Early Access</span>
              </div>

              <h3 className="font-syne text-[28px] font-extrabold text-slate-100 tracking-[-1px] leading-[1.15] mb-3">
                Stay ahead of<br />governed AI.
              </h3>
              <p className="text-[14px] text-slate-400 leading-relaxed mb-8 max-w-[340px]">
                Get notified when we ship new resolvers, compliance frameworks, and
                deployment guides. No spam — just signal.
              </p>

              {status === "success" ? (
                <div className="flex items-center gap-3 px-5 py-4 rounded-[12px] bg-emerald-500/10 border border-emerald-500/20">
                  <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 shrink-0">
                    <circle cx="10" cy="10" r="9" stroke="#10B981" strokeWidth="1.3" />
                    <path d="M6.5 10l2.5 2.5 4.5-5" stroke="#10B981" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-[14px] text-emerald-400">{message}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 rounded-[10px] px-4 py-3 text-[14px] text-slate-100 outline-none transition-all font-mono bg-slate-950 border border-slate-800 focus:border-amber-500/50 placeholder:text-slate-600"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading" || !email.trim()}
                    className="px-6 py-3 text-slate-950 text-[14px] font-bold rounded-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap bg-amber-400 hover:bg-amber-300"
                  >
                    {status === "loading" ? "Joining…" : "Join the list"}
                  </button>
                </form>
              )}

              {status === "error" && (
                <p className="text-[12px] text-red-400 mt-2">{message}</p>
              )}

              <p className="text-[11px] text-slate-600 mt-4 font-mono">
                No spam. Unsubscribe any time.
              </p>
            </div>

            {/* Right — Community links */}
            <div className="p-10">
              <p className="font-mono text-[11px] text-slate-500 uppercase tracking-widest mb-6">
                Join the community
              </p>

              <div className="space-y-3 mb-8">
                {LINKS.map(({ icon, label, sub, href, color, iconColor, labelColor }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-4 p-4 rounded-[12px] transition-all bg-slate-950 border border-slate-800 hover:border-slate-700 ${color}`}
                  >
                    <div className={`shrink-0 transition-colors ${iconColor}`}>{icon}</div>
                    <div>
                      <p className={`text-[14px] font-semibold transition-colors ${labelColor}`}>{label}</p>
                      <p className="text-[12px] text-slate-500">{sub}</p>
                    </div>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors">
                      <path d="M7 13L13 7M13 7H7M13 7v6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                ))}
              </div>

              {/* Origin note */}
              <div className="rounded-[12px] px-5 py-4 bg-slate-950 border border-slate-800">
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  <span className="text-slate-200 font-medium">Built in public from day one.</span>{" "}
                  Every resolver, every kernel decision, every compliance
                  framework — open source, auditable, and MIT licensed.
                  Africa surfaced the problems. The solutions belong to everyone.
                </p>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}