"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const EXAMPLES = [
  {
    domain: "Finance",
    file: "agent-to-agent.ol",
    agentA: "Filybee (Finance Agent)",
    agentB: "Compliance Agent",
    output: '"Balance: ₦12,450.00 — cleared by compliance. Audit: sha3:a1b2c3"',
    code: `<span class="t-cm">// Agent A (Filybee) calls Agent B (Compliance)</span>
<span class="t-kw">Workflow</span> <span class="t-str">"Balance + Compliance Check"</span> <span class="t-key">with</span> <span class="t-val">customer_id</span>

<span class="t-kw">Allow resolvers:</span>
<span class="t-op">-</span> <span class="t-str">@o-lang/bank-account-lookup</span>
<span class="t-op">-</span> <span class="t-str">@grass/compliance-agent</span>

<span class="t-key">Step 1:</span> <span class="t-kw">Ask</span> <span class="t-str">@o-lang/bank-account-lookup</span> <span class="t-val">"{customer_id}"</span>
<span class="t-kw">Save as</span> <span class="t-fn">account_info</span>

<span class="t-cm">// Hands off to compliance agent — governed at every hop</span>
<span class="t-key">Step 2:</span> <span class="t-kw">Ask</span> <span class="t-str">@grass/compliance-agent</span> <span class="t-val">"{account_info.balance}" "{customer_id}"</span>
<span class="t-kw">Save as</span> <span class="t-fn">clearance</span>

<span class="t-kw">Return</span> <span class="t-fn">clearance</span>`,
  },
  {
    domain: "Healthcare",
    file: "agent-handoff.ol",
    agentA: "Triage Agent",
    agentB: "ICU Admission Agent",
    output: '"Bed 4B assigned. Dr. Okafor notified. Patient data sealed."',
    code: `<span class="t-cm">// Triage Agent hands off to ICU Agent — zero data leakage</span>
<span class="t-kw">Workflow</span> <span class="t-str">"Triage to ICU Handoff"</span> <span class="t-key">with</span> <span class="t-val">patient_id</span><span class="t-op">,</span> <span class="t-val">symptoms</span>

<span class="t-kw">Allow resolvers:</span>
<span class="t-op">-</span> <span class="t-str">@o-lang/triage-agent</span>
<span class="t-op">-</span> <span class="t-str">@o-lang/icu-admission</span>

<span class="t-key">Step 1:</span> <span class="t-kw">Ask</span> <span class="t-str">@o-lang/triage-agent</span> <span class="t-val">"{patient_id}" "{symptoms}"</span>
<span class="t-kw">Save as</span> <span class="t-fn">triage_result</span>

<span class="t-cm">// ICU agent receives only what it's allowed to see</span>
<span class="t-key">Step 2:</span> <span class="t-kw">Ask</span> <span class="t-str">@o-lang/icu-admission</span> <span class="t-val">"{triage_result.severity}" "{patient_id}"</span>
<span class="t-kw">Save as</span> <span class="t-fn">admission</span>

<span class="t-kw">Return</span> <span class="t-fn">admission</span>`,
  },
  {
    domain: "Government",
    file: "cross-agency.ol",
    agentA: "Immigration Agent",
    agentB: "Revenue Agent",
    output: '"GV-4421: identity verified across 2 agencies. Audit trail sealed."',
    code: `<span class="t-cm">// Cross-agency agent communication — each bounded by policy</span>
<span class="t-kw">Workflow</span> <span class="t-str">"Cross-Agency Verification"</span> <span class="t-key">with</span> <span class="t-val">citizen_id</span>

<span class="t-kw">Allow resolvers:</span>
<span class="t-op">-</span> <span class="t-str">@gov/immigration-agent</span>
<span class="t-op">-</span> <span class="t-str">@gov/revenue-agent</span>

<span class="t-key">Step 1:</span> <span class="t-kw">Ask</span> <span class="t-str">@gov/immigration-agent</span> <span class="t-val">"{citizen_id}"</span>
<span class="t-kw">Save as</span> <span class="t-fn">identity</span>

<span class="t-cm">// Revenue agent never sees immigration data — only clearance status</span>
<span class="t-key">Step 2:</span> <span class="t-kw">Ask</span> <span class="t-str">@gov/revenue-agent</span> <span class="t-val">"{identity.status}" "{citizen_id}"</span>
<span class="t-kw">Save as</span> <span class="t-fn">verification</span>

<span class="t-kw">Return</span> <span class="t-fn">verification</span>`,
  },
  {
    domain: "IoT",
    file: "edge-to-cloud.ol",
    agentA: "Edge Sensor Agent",
    agentB: "Cloud Response Agent",
    output: '"T-04 breach confirmed. Maintenance dispatched. Hash: sha3:f9e2d1"',
    code: `<span class="t-cm">// Edge agent to cloud agent — integrity signed at every hop</span>
<span class="t-kw">Workflow</span> <span class="t-str">"Edge to Cloud Alert"</span> <span class="t-key">with</span> <span class="t-val">sensor_id</span><span class="t-op">,</span> <span class="t-val">reading</span>

<span class="t-kw">Allow resolvers:</span>
<span class="t-op">-</span> <span class="t-str">@o-lang/edge-sensor-agent</span>
<span class="t-op">-</span> <span class="t-str">@o-lang/cloud-response-agent</span>

<span class="t-key">Step 1:</span> <span class="t-kw">Ask</span> <span class="t-str">@o-lang/edge-sensor-agent</span> <span class="t-val">"{sensor_id}" "{reading}"</span>
<span class="t-kw">Save as</span> <span class="t-fn">alert</span>

<span class="t-cm">// Cloud agent receives signed payload — tamper-proof</span>
<span class="t-key">Step 2:</span> <span class="t-kw">Ask</span> <span class="t-str">@o-lang/cloud-response-agent</span> <span class="t-val">"{alert.severity}" "{alert.signed_payload}"</span>
<span class="t-kw">Save as</span> <span class="t-fn">response</span>

<span class="t-kw">Return</span> <span class="t-fn">response</span>`,
  },
];

export function HeroSection() {
  const [active, setActive] = React.useState(0);
  const example = EXAMPLES[active];

  React.useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % EXAMPLES.length), 4000);
    return () => clearInterval(t);
  }, []);

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
          The governance layer for the agentic web · MIT Licensed
        </span>
      </motion.div>

      {/* H1 */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="font-syne text-[clamp(40px,6vw,76px)] font-extrabold tracking-[-2px] leading-[1.06] text-white mb-6"
      >
        Agents don&apos;t trust<br />
        each other.{" "}
        <span className="text-grad-blue">O-Lang does.</span>
      </motion.h1>

      {/* Subheading */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.18 }}
        className="text-[clamp(16px,2vw,20px)] text-white/65 max-w-[620px] leading-[1.65] mb-4"
      >
        O-Lang is the protocol that lets AI agents built anywhere — different teams,
        different models, different countries — communicate with each other under a
        shared governance contract. Every exchange is bounded, audited, and
        cryptographically signed before it reaches the next agent.
      </motion.p>

      {/* Secondary line */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.24 }}
        className="text-[13.5px] text-white/35 max-w-[520px] leading-relaxed mb-10 -mt-4"
      >
        Your agent calls mine. Mine calls a government registry.{" "}
        <span className="text-white/55">O-Lang ensures every hop is governed — not just the first one.</span>
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.26 }}
        className="flex gap-3 justify-center flex-wrap mb-10"
      >
        <Link
          href="/generate"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-bold text-white bg-grad-blue rounded-[10px] shadow-blue hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(26,86,219,0.5)] transition-all"
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M10 2v4M4.93 4.93l2.83 2.83M2 10h4M4.93 15.07l2.83-2.83M10 18v-4M15.07 15.07l-2.83-2.83M18 10h-4M15.07 4.93l-2.83 2.83"/></svg>
          Generate a workflow
        </Link>
        <Link
          href="/playground"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-semibold text-white/85 bg-white/[0.06] border border-white/15 rounded-[10px] hover:bg-white/10 hover:border-white/25 hover:text-white transition-all"
        >
          <svg viewBox="0 0 20 20" className="w-4 h-4 fill-current opacity-80"><path d="M5 3l11 7-11 7V3z" /></svg>
          Open Playground
        </Link>
        <Link
          href="/docs"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-semibold text-white/60 hover:text-white/90 transition-all"
        >
          Read the docs →
        </Link>
      </motion.div>

      {/* Domain tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex gap-2 justify-center flex-wrap mb-5"
      >
        {EXAMPLES.map((ex, i) => (
          <button
            key={ex.domain}
            onClick={() => setActive(i)}
            className={`font-mono text-[12px] px-3.5 py-1.5 rounded-full border transition-all ${
              i === active
                ? "bg-blue/20 border-blue-muted/40 text-blue-muted"
                : "border-white/10 text-white/35 hover:text-white/60 hover:border-white/20"
            }`}
          >
            {ex.domain}
          </button>
        ))}
      </motion.div>

      {/* Code window */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.38 }}
        className="w-full max-w-[820px]"
      >
        <div className="code-window">
          {/* Title bar — shows agent A → agent B handoff */}
          <div className="flex items-center gap-2.5 px-[18px] py-3 bg-white/[0.04] border-b border-white/[0.07]">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28ca41]" />
            </div>
            <span className="font-mono text-[12px] text-white/40 ml-1.5">{example.file}</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[11px] text-white/35">{example.agentA}</span>
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-blue-muted"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
              <span className="font-mono text-[11px] text-blue-muted">{example.agentB}</span>
            </div>
          </div>

          {/* Code body */}
          <div className="px-7 py-6 font-mono text-[13.5px] leading-[1.75] overflow-x-auto min-h-[240px]">
            <pre dangerouslySetInnerHTML={{ __html: example.code }} />
          </div>

          {/* Output strip */}
          <div className="border-t border-white/[0.07]">
            <div className="flex items-center gap-3 px-7 py-3">
              <span className="font-mono text-[11px] text-white/25 uppercase tracking-[0.8px]">output</span>
              <span className="font-mono text-[13px] text-green-muted">{example.output}</span>
            </div>
            <div className="flex items-center gap-3 px-7 py-2.5 border-t border-white/[0.05]" style={{ background: "rgba(52,211,153,0.04)" }}>
              {[
                { label: "PII redacted" },
                { label: "intent verified" },
                { label: "audit signed" },
                { label: "signed at every hop" },
              ].map((item, i) => (
                <span key={item.label} className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-green-muted">✓</span>
                  <span className="font-mono text-[11px] text-green-muted/70 tracking-[0.2px]">{item.label}</span>
                  {i < 3 && <span className="font-mono text-[11px] text-white/15 ml-1">·</span>}
                </span>
              ))}
              <span className="ml-auto font-mono text-[11px] text-green-muted/50">kernel-governed</span>
            </div>
          </div>

          {/* Bottom strip */}
                    {/* Bottom strip */}
          <div className="flex items-center gap-2 px-7 py-2.5 border-t border-white/[0.05]" style={{ background: "rgba(255,255,255,0.015)" }}>
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-widest">governs</span>
            {["Any model", "Any tool/API", "Any legacy system", "One contract"].map((t) => (
              <span key={t} className="font-mono text-[10px] px-2 py-0.5 rounded"
                    style={{ color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}