"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const CODE = `<span class="t-cm">// O-Lang — Bank Balance Workflow</span>
<span class="t-kw">Workflow</span> <span class="t-str">"Bank Balance Check"</span> <span class="t-key">with</span> <span class="t-val">user_question</span><span class="t-op">,</span> <span class="t-val">customer_id</span>

<span class="t-kw">Allow resolvers:</span>
<span class="t-op">-</span> <span class="t-str">@o-lang/bank-account-lookup</span>
<span class="t-op">-</span> <span class="t-str">@o-lang/llm-groq</span>

<span class="t-key">Step 1:</span> <span class="t-kw">Ask</span> <span class="t-str">@o-lang/bank-account-lookup</span> <span class="t-val">"{customer_id}"</span>
<span class="t-kw">Save as</span> <span class="t-fn">account_info</span>

<span class="t-key">Step 2:</span> <span class="t-kw">Ask</span> <span class="t-str">@o-lang/llm-groq</span> <span class="t-val">"{user_question}.
Balance is {account_info.balance}."</span>
<span class="t-kw">Save as</span> <span class="t-fn">response</span>

<span class="t-kw">Return</span> <span class="t-fn">response</span>`;

export function HeroSection() {
  return (
    <section className="min-h-screen bg-grad-hero flex flex-col items-center justify-center px-[5%] pt-28 pb-20 relative overflow-hidden text-center">
      {/* Grid background */}
      <div className="absolute inset-0 bg-hero-grid opacity-[0.04] pointer-events-none" />

      {/* Glow blobs */}
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(26,86,219,0.18)_0%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.12)_0%,transparent_70%)] bottom-[10%] right-[15%] pointer-events-none" />

      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 bg-blue/15 border border-blue-muted/30 rounded-full px-3.5 py-1.5 mb-7"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-blue-muted shadow-[0_0_0_3px_rgba(96,165,250,0.25)] animate-pulse-ring" />
        <span className="font-mono text-[12px] text-blue-muted tracking-[0.4px]">
          Governed AI runtime · Production-ready · MIT Licensed
        </span>
      </motion.div>

      {/* H1 */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="font-syne text-[clamp(40px,6vw,76px)] font-extrabold tracking-[-2px] leading-[1.06] text-white mb-6"
      >
        AI that can&apos;t lie,<br />
        leak, or go{" "}
        <span className="text-grad-blue">rogue</span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.18 }}
        className="text-[clamp(16px,2vw,20px)] text-white/65 max-w-[600px] leading-[1.65] mb-4"
      >
        O-Lang is a governed workflow language with its own runtime, tool registry,
        and cryptographic audit layer. Write AI workflows that can&apos;t lie, leak data,
        or exceed their declared scope — from first line to production.
      </motion.p>

      {/* Compatibility note */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.24 }}
        className="text-[13.5px] text-white/35 max-w-[520px] leading-relaxed mb-10 -mt-4"
      >
        Already using LangChain, CrewAI, or OpenAI Agents?{" "}
        <span className="text-white/55">O-Lang governs their tool calls without replacing them.</span>
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.26 }}
        className="flex gap-3 justify-center flex-wrap mb-6"
      >
        <Link
          href="/playground"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-bold text-white bg-grad-blue rounded-[10px] shadow-blue hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(26,86,219,0.5)] transition-all"
        >
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-white"><path d="M5 3l11 7-11 7V3z" /></svg>
          Open Playground
        </Link>
        <Link
          href="/#how"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-semibold text-white/85 bg-white/[0.06] border border-white/15 rounded-[10px] hover:bg-white/10 hover:border-white/25 hover:text-white transition-all"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M3 5h14M3 9h14M3 13h8" /></svg>
          Read the docs
        </Link>
      </motion.div>

      {/* ── ISO compliance trust strip ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.32 }}
        className="flex items-center gap-2.5 flex-wrap justify-center mb-14"
      >
        {[
          { label: "ISO 42001", sub: "AI Management" },
          { label: "ISO 27001", sub: "Information Security" },
        ].map(({ label, sub }) => (
          <div
            key={label}
            className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.10] rounded-full px-3.5 py-1.5"
          >
            {/* Checkmark circle */}
            <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 shrink-0" fill="none">
              <circle cx="7" cy="7" r="6" stroke="rgba(96,165,250,0.55)" strokeWidth="1.2" />
              <path
                d="M4.5 7l1.8 1.8L9.5 5"
                stroke="rgba(96,165,250,0.85)"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-mono text-[11px] text-white/55 tracking-[0.3px]">
              {label}
              <span className="text-white/30 ml-1.5">· {sub}</span>
            </span>
          </div>
        ))}

        {/* Separator dot */}
        <span className="w-1 h-1 rounded-full bg-white/15" />

        {/* Aligned label */}
        <span className="font-mono text-[11px] text-white/25 tracking-[0.5px]">
          aligned
        </span>
      </motion.div>

      {/* Code window */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.42 }}
        className="w-full max-w-[820px]"
      >
        <div className="code-window">
          {/* Title bar */}
          <div className="flex items-center gap-2.5 px-[18px] py-3 bg-white/[0.04] border-b border-white/[0.07]">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28ca41]" />
            </div>
            <span className="font-mono text-[12px] text-white/40 ml-1.5">bank-balance.ol</span>
            <div className="ml-auto flex gap-0.5">
              {["workflow", "tools", "output"].map((t, i) => (
                <span key={t} className={`font-mono text-[11px] px-2.5 py-1 rounded-[5px] cursor-pointer ${i === 0 ? "bg-blue/20 text-blue-muted" : "text-white/35 hover:text-white/60"}`}>{t}</span>
              ))}
            </div>
          </div>

          {/* Code body */}
          <div className="px-7 py-6 font-mono text-[13.5px] leading-[1.75] overflow-x-auto">
            <pre dangerouslySetInnerHTML={{ __html: CODE }} />
          </div>

          {/* Output strip */}
          <div className="flex items-center gap-3 px-7 py-3.5 border-t border-white/[0.07]">
            <span className="font-mono text-[11px] text-white/25 uppercase tracking-[0.8px]">output</span>
            <span className="font-mono text-[13px] text-green-muted">&quot;Your current balance is $12,450.00&quot;</span>
            <div className="ml-auto flex items-center gap-1.5 bg-green/12 border border-green/25 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-muted shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="font-mono text-[11px] text-green-muted tracking-[0.3px]">kernel-governed · 432ms</span>
            </div>
          </div>

          {/* Language badge strip */}
          <div className="flex items-center gap-2 px-7 py-2.5 border-t border-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">tools run on</span>
            {["Groq", "OpenAI", "Anthropic", "any HTTP API", "your own tools"].map((lang) => (
              <span key={lang} className="font-mono text-[10px] px-2 py-0.5 rounded"
                    style={{ color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {lang}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}