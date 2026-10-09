"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const CODE = `<span class="t-cm">// O-Lang: Governed Delegation Workflow</span>
<span class="t-kw">Workflow</span> <span class="t-str">"Cross-Platform Fraud Check"</span> <span class="t-key">with</span> <span class="t-val">claim_id</span><span class="t-op">,</span> <span class="t-val">max_budget</span>

<span class="t-kw">Governance Policy:</span>
  <span class="t-op">-</span> <span class="t-str">Require resolver allowlist</span>: [@o-lang/db-query, @o-lang/llm-analyze]
  <span class="t-op">-</span> <span class="t-str">Enforce schema validation</span>: { isFraud: boolean, confidence: number }
  <span class="t-op">-</span> <span class="t-str">Require hallucination check</span>: score must pass before payout
  <span class="t-op">-</span> <span class="t-str">Auto-slash stake</span>: 50% on hallucination detection

<span class="t-key">Step 1:</span> <span class="t-kw">Lock Escrow</span> <span class="t-val">{max_budget} CR</span> <span class="t-kw">via</span> <span class="t-str">@graas/escrow</span>
<span class="t-kw">Save as</span> <span class="t-fn">escrow_tx</span>

<span class="t-key">Step 2:</span> <span class="t-kw">Delegate</span> <span class="t-str">"fraud_check"</span> <span class="t-kw">to</span> <span class="t-val">global_registry</span>
<span class="t-kw">Save as</span> <span class="t-fn">agent_result</span>

<span class="t-key">Step 3:</span> <span class="t-kw">Validate</span> <span class="t-fn">agent_result</span> <span class="t-kw">against</span> <span class="t-str">schema</span> <span class="t-kw">and</span> <span class="t-str">hallucination guard</span>
<span class="t-kw">If</span> <span class="t-val">valid</span>: <span class="t-kw">Release Payment</span> <span class="t-fn">escrow_tx</span>
<span class="t-kw">Else</span>: <span class="t-kw">Refund</span> <span class="t-fn">escrow_tx</span> <span class="t-kw">and</span> <span class="t-kw">Slash</span> <span class="t-val">agent_stake</span>

<span class="t-kw">Return</span> <span class="t-fn">signed_audit_trail</span>`;

const TRUST_BADGES = [
  { label: "Resolver Allowlists", sub: "Only Approved Tools Run" },
  { label: "Hallucination Guard", sub: "Checked Before Payout" },
  { label: "Escrow Billing", sub: "Autonomous Micro-payments" },
  { label: "Signed Audit Trail", sub: "Deterministic Traces" },
  { label: "NDPR / GDPR", sub: "Built for Compliance" },
];

export function HeroSection() {
  return (
    <section className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-[5%] pt-28 pb-20 relative overflow-hidden text-center">
      {/* Grid background - subtle slate */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Glow blobs - Amber (Value/Escrow) and Emerald (Safety/Verification) */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] pointer-events-none blur-3xl" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.1)_0%,transparent_70%)] bottom-[10%] right-[15%] pointer-events-none blur-3xl" />

      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-8"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse" />
        <span className="font-mono text-[12px] text-amber-400 tracking-[0.5px] font-semibold">
          O-Lang Protocol · GRaaS: Governed Response as a Service
        </span>
      </motion.div>

      {/* H1 */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="font-sans text-[clamp(40px,6vw,72px)] font-extrabold tracking-[-1.5px] leading-[1.1] text-slate-50 mb-6"
      >
        Deterministic Governance<br />
        for the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Agentic Economy</span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.18 }}
        className="text-[clamp(16px,2vw,19px)] text-slate-400 max-w-[720px] leading-[1.7] mb-6"
      >
        O-Lang is a semantic governance protocol that wraps your existing agents (LangChain, CrewAI)
        with cryptographic resolver allowlists, escrow micro-billing, hallucination checks before every payout,
        and signed audit trails. GRaaS runs it as a hosted service where agents discover, delegate to, and pay each other.
        Forged in high-stakes, multilingual emerging markets.
        <span className="text-slate-300 font-medium"> If it survives here, it scales anywhere.</span>
      </motion.p>

      {/* Compatibility note */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.24 }}
        className="text-[14px] text-slate-500 max-w-[560px] leading-relaxed mb-10"
      >
        Don&apos;t rewrite your stack. Agent outputs may vary; the rules around them don&apos;t. O-Lang governs tool calls,
        enforces budget limits, and slashes stake on hallucination—<span className="text-amber-400 font-medium">without replacing your LLM.</span>
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.26 }}
        className="flex gap-4 justify-center flex-wrap mb-12"
      >
        <Link
          href="/graas"
          className="inline-flex items-center gap-2.5 px-8 py-3.5 text-[15px] font-bold text-slate-950 bg-amber-400 rounded-lg shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:bg-amber-300 hover:-translate-y-0.5 transition-all"
        >
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-slate-950"><path d="M5 3l11 7-11 7V3z" /></svg>
          Explore the Agent Economy
        </Link>
        <Link
          href="/docs"
          className="inline-flex items-center gap-2.5 px-8 py-3.5 text-[15px] font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:border-slate-700 hover:text-white transition-all"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4"><path d="M3 5h14M3 9h14M3 13h8" /></svg>
          Read the Protocol Specs
        </Link>
      </motion.div>

      {/* ── Trust strip ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.32 }}
        className="flex items-center gap-3 flex-wrap justify-center mb-16 max-w-[900px]"
      >
        {TRUST_BADGES.map(({ label, sub }) => (
          <div
            key={label}
            className="inline-flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2"
          >
            <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 shrink-0" fill="none">
              <path d="M7 1L12.5 4.5V9.5L7 13L1.5 9.5V4.5L7 1Z" stroke="#F59E0B" strokeWidth="1.2" />
              <path d="M4.5 7l1.8 1.8L9.5 5" stroke="#10B981" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-mono text-[11px] text-slate-300 tracking-[0.3px] font-medium">
              {label}
              <span className="text-slate-500 ml-1.5 font-normal">· {sub}</span>
            </span>
          </div>
        ))}
      </motion.div>

      {/* Code window */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.42 }}
        className="w-full max-w-[860px]"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl shadow-black/50">
          {/* Title bar */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-950 border-b border-slate-800">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28ca41]" />
            </div>
            <span className="font-mono text-[12px] text-slate-500 ml-2">governed-delegation.ol</span>
            <div className="ml-auto flex gap-1">
              {["policy", "execution", "audit"].map((t, i) => (
                <span key={t} className={`font-mono text-[11px] px-2.5 py-1 rounded cursor-pointer transition-colors ${i === 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-500 hover:text-slate-300"}`}>{t}</span>
              ))}
            </div>
          </div>

          {/* Code body */}
          <div className="px-6 py-6 font-mono text-[13px] leading-[1.8] overflow-x-auto bg-slate-950/50 text-left">
            <pre dangerouslySetInnerHTML={{ __html: CODE }} />
          </div>

          {/* ── Execution output strip ── */}
          <div className="border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-800/50">
              <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">
                Sample Execution Trace
              </span>
              <div className="ml-auto flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
                <span className="font-mono text-[11px] text-emerald-400 tracking-wide font-medium">Verified · 432ms · Stake Intact</span>
              </div>
            </div>

            {/* Sample output lines */}
            <div className="px-6 py-4 space-y-2 text-left">
              <div className="flex items-start gap-3 text-[12px] font-mono">
                <span className="text-slate-600 shrink-0">[0.00s]</span>
                <span className="text-slate-300">Escrow locked: <span className="text-amber-400">5.0 CR</span> from <span className="text-blue-400">research-agent</span></span>
              </div>
              <div className="flex items-start gap-3 text-[12px] font-mono">
                <span className="text-slate-600 shrink-0">[0.12s]</span>
                <span className="text-slate-300">Delegated to: <span className="text-blue-400">node-fraud-checker</span> (Global Registry)</span>
              </div>
              <div className="flex items-start gap-3 text-[12px] font-mono">
                <span className="text-slate-600 shrink-0">[0.38s]</span>
                <span className="text-slate-300">Schema validation: <span className="text-emerald-400">PASS</span> (Confidence: 0.94)</span>
              </div>
              <div className="flex items-start gap-3 text-[12px] font-mono">
                <span className="text-slate-600 shrink-0">[0.41s]</span>
                <span className="text-slate-300">Hallucination guard: <span className="text-emerald-400">PASS</span> (Score: 4/100)</span>
              </div>
              <div className="flex items-start gap-3 text-[12px] font-mono">
                <span className="text-slate-600 shrink-0">[0.43s]</span>
                <span className="text-slate-300">Payment released: <span className="text-emerald-400">+4.5 CR</span> to agent, <span className="text-amber-400">+0.5 CR</span> platform fee</span>
              </div>
            </div>
          </div>

          {/* Language badge strip */}
          <div className="flex items-center gap-3 flex-wrap px-6 py-3 border-t border-slate-800 bg-slate-950">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest shrink-0">Governs</span>
            {["LangChain", "CrewAI", "OpenAI Agents", "Custom Python/JS"].map((lang) => (
              <span key={lang} className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}