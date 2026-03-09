"use client";

import React from "react";

import Link from "next/link";
import { SectionHeader, Card } from "@/components/ui";

// ── STATS STRIP ────────────────────────────────────────────────────────────
export function StatsStrip() {
  const stats = [
    { num: "3×",   label: "Workflow domains in v1.1" },
    { num: "100%", label: "Cryptographic audit coverage" },
    { num: "0",    label: "Hallucinations in governed scope" },
    { num: "MIT",  label: "Open source license" },
  ];
  return (
    <div className="bg-surface-2 border-y border-border py-8 px-[5%]">
      <div className="max-w-[1160px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, i) => (
          <div key={i} className={`text-center px-6 ${i < 3 ? "lg:border-r lg:border-border" : ""}`}>
            <span className="font-syne text-[36px] font-extrabold tracking-[-1px] text-ink block">
              {s.num.replace(/[×%]/g, (m) => `<span class="text-blue">${m}</span>`).includes("<") ? (
                <span dangerouslySetInnerHTML={{ __html: s.num.replace(/([×%])/g, '<span style="color:#1a56db">$1</span>') }} />
              ) : s.num}
            </span>
            <p className="text-sm text-ink-5 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HOW IT WORKS ───────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    n: "1", color: "#1a56db", bg: "#eff6ff",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    title: "Write your workflow",
    text: "Define steps, tools, and governance rules in a .ol file. Declare what's allowed. Declare what's prohibited. That's your contract.",
  },
  {
    n: "2", color: "#059669", bg: "#f0fdf4",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: "Kernel enforces governance",
    text: "The O-Lang kernel validates every tool call against your allowlist, checks intent scope, runs safety filters, and blocks prohibited actions — before execution.",
  },
  {
    n: "3", color: "#7c3aed", bg: "#faf5ff",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 1.2-.504 2.4-1.512 3.312A12.022 12.022 0 0112 21a12.022 12.022 0 01-7.488-5.688A9.955 9.955 0 013 12V5.7L12 3l9 2.7V12z"/></svg>,
    title: "Cryptographic audit trail",
    text: "Every execution is SHA3-256 fingerprinted and ED25519-signed by the kernel. Your outputs are verifiable, tamper-evident, and ready for compliance.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-[5%]" id="how">
      <div className="max-w-[1160px] mx-auto">
        <SectionHeader
          eyebrow="How it works"
          title={<>Governance baked in,<br />not bolted on</>}
          subtitle="Every O-Lang workflow passes through the kernel — a runtime that validates, governs, and signs every execution before returning output."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 reveal">
          {HOW_STEPS.map((s) => (
            <Card key={s.n} hover className="relative overflow-hidden">
              <span className="font-syne text-[72px] font-extrabold text-border leading-none absolute top-4 right-5 pointer-events-none select-none">{s.n}</span>
              <div className="w-12 h-12 rounded-[13px] flex items-center justify-center mb-5" style={{ background: s.bg }}>{s.icon}</div>
              <h3 className="font-syne text-[19px] font-bold text-ink mb-2.5">{s.title}</h3>
              <p className="text-[15px] text-ink-4 leading-relaxed">{s.text}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── FEATURES ───────────────────────────────────────────────────────────────
const FEATURES = [
  { color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe", tag: "@governance.allowed_tools", title: "Tool Allowlists", text: "Every workflow declares exactly which tools it may call. Any unlisted tool is rejected by the kernel at runtime — no exceptions.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="1.8"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg> },
  { color: "#059669", bg: "#f0fdf4", border: "#bbf7d0", tag: "__verified_intent", title: "Verified Intent", text: "Declare scope and prohibited actions. The kernel enforces both before and after execution — zero tolerance for scope creep.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg> },
  { color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff", tag: "sha3-256 · ed25519", title: "Cryptographic Audit", text: "Every execution produces a SHA3-256 fingerprint, chained to the previous, and signed with ED25519. Full deterministic proof.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 7h6M9 11h6M9 15h4"/></svg> },
  { color: "#d97706", bg: "#fffbeb", border: "#fde68a", tag: "$step.symbol.field", title: "Symbol Resolution", text: "Steps compose with typed symbols. Each tool declares its output schema — downstream steps receive validated, typed data, never raw LLM output.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
  { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", tag: "safety_policy", title: "Safety Policy Engine", text: "Built-in safety filters block hallucinations, PII leakage, speculative outputs, and prompt injection — configurable per domain.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", tag: "@o-lang/tool-name", title: "Tool Registry", text: "Publish, version, and discover tools at olang.cloud/registry. Every tool is signed and schema-validated before listing.", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-[5%] bg-surface-2" id="features">
      <div className="max-w-[1160px] mx-auto">
        <SectionHeader
          eyebrow="Core capabilities"
          title={<>Everything a governed<br />AI runtime needs</>}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-14 reveal">
          {FEATURES.map((f) => (
            <Card key={f.title} hover accentColor={f.color}>
              <div className="w-[42px] h-[42px] rounded-[11px] flex items-center justify-center mb-4" style={{ background: f.bg }}>{f.icon}</div>
              <h3 className="font-syne text-[16px] font-bold text-ink mb-2">{f.title}</h3>
              <p className="text-[14px] text-ink-4 leading-relaxed mb-3">{f.text}</p>
              <span className="inline-block font-mono text-[11px] px-2 py-0.5 rounded-[5px]" style={{ background: f.bg, color: f.color, border: `1px solid ${f.border}` }}>{f.tag}</span>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── DOMAINS ────────────────────────────────────────────────────────────────
const DOMAINS = [
  {
    key: "finance", label: "Finance", bg: "#eff6ff", border: "#bfdbfe", textBg: "FIN", accent: "#1a56db", gradFrom: "#1245b8",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><circle cx="6" cy="15" r="1.5"/></svg>,
    desc: "Balance inquiries, transaction classification, fraud detection — all with PII validation, hallucination prevention, and audit-ready compliance trails.",
    pills: ["Bank balance workflow", "Transaction analysis", "AML screening"],
  },
  {
    key: "health", label: "Healthcare", bg: "#f0fdf4", border: "#bbf7d0", textBg: "MED", accent: "#059669", gradFrom: "#047857",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    desc: "ICU admissions, clinical triage, ward management — with team-scoped access, HIPAA filters, and zero-tolerance prohibited procedure enforcement.",
    pills: ["ICU admission workflow", "Clinical triage", "Drug interaction check"],
  },
  {
    key: "legal", label: "Legal", bg: "#faf5ff", border: "#e9d5ff", textBg: "LAW", accent: "#7c3aed", gradFrom: "#6d28d9",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    desc: "Contract extraction, NDA review, clause identification — extract-only mode blocks legal advice output, protecting against unauthorized practice of law.",
    pills: ["Contract review", "Clause extraction", "Jurisdiction compliance"],
  },
];

export function DomainsSection() {
  return (
    <section className="py-24 px-[5%]" id="domains">
      <div className="max-w-[1160px] mx-auto">
        <SectionHeader
          eyebrow="Use cases"
          title={<>Governed AI for<br />high-stakes domains</>}
          subtitle="O-Lang was designed for industries where AI errors are not just inconvenient — they are dangerous, illegal, or catastrophic."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14 reveal">
          {DOMAINS.map((d) => (
            <div
              key={d.key}
              className="rounded-[20px] p-8 relative overflow-hidden transition-all duration-200 hover:-translate-y-1"
              style={{ background: d.bg, border: `1.5px solid ${d.border}` }}
            >
              <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-5 shadow-md" style={{ background: `linear-gradient(135deg,${d.gradFrom},${d.accent})` }}>{d.icon}</div>
              <h3 className="font-syne text-[20px] font-extrabold text-ink mb-2">{d.label}</h3>
              <p className="text-[14.5px] text-ink-4 leading-relaxed mb-5">{d.desc}</p>
              <div className="flex flex-col gap-2">
                {d.pills.map((p) => (
                  <div key={p} className="flex items-center gap-2 font-mono text-[12px] text-ink-3 bg-white/80 border border-black/[0.08] px-3 py-1.5 rounded-[8px]">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.accent }} />
                    {p}
                  </div>
                ))}
              </div>
              <span className="absolute bottom-[-10px] right-[-8px] font-syne text-[88px] font-extrabold opacity-[0.04] text-ink leading-none pointer-events-none select-none">{d.textBg}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── DOCS TEASER ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DOC_CARDS: { href: string; color: string; iconColor: string; title: string; sub: string; specHref?: string; icon: React.ReactNode }[] = [
  { href: "/docs#quickstart", color: "rgba(26,86,219,.25)", iconColor: "#93c5fd", title: "Quickstart Guide", sub: "Install the kernel, write your first .ol file, run it", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
  { href: "/docs#tools", color: "rgba(5,150,105,.25)", iconColor: "#6ee7b7", title: "Building Tools", sub: "Write, schema-validate, and publish tools (resolvers)", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6ee7b7" strokeWidth="1.8"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg> },
  { href: "/docs#governance", color: "rgba(124,58,237,.25)", iconColor: "#c4b5fd", title: "Governance Deep Dive", sub: "Intent, allowlists, audit chains, safety policy", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
  { href: "/docs#kernel", color: "rgba(217,119,6,.2)", iconColor: "#fcd34d", title: "Kernel Architecture", sub: "Runtime internals, embedding, self-hosting · v1.1 spec ↗",  icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fcd34d" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M21 12h-2M5 12H3M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M12 21v-2M12 5V3"/></svg> },
];

export function DocsTeaserSection() {
  return (
    <section className="py-24 px-[5%] bg-grad-hero relative overflow-hidden" id="docs">
      <div className="absolute inset-0 bg-hero-grid opacity-[0.025] pointer-events-none" />
      <div className="max-w-[1160px] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center reveal">
          <div>
            <SectionHeader eyebrow="Documentation" title={<>Everything you need<br />to build governed AI</>} subtitle="From installing the kernel to publishing your first tool — step-by-step guides, API reference, and real-world examples." light />
            <div className="flex gap-2.5 flex-wrap mt-8">
              <Link href="/docs/quickstart" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-grad-blue rounded-[10px] shadow-blue hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(26,86,219,0.45)] transition-all">Get started in 5 min →</Link>
              <Link href="/docs/reference" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white/80 bg-white/[0.07] border border-white/15 rounded-[10px] hover:bg-white/[0.12] hover:text-white transition-all">API Reference</Link>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            {DOC_CARDS.map((c) => (
              <Link key={c.href} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined} className="flex items-center gap-4 bg-white/[0.05] border border-white/10 rounded-xl px-[18px] py-4 hover:bg-white/[0.09] transition-all group">
                <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: c.color }}>{c.icon}</div>
                <div>
                  <p className="font-syne text-[14px] font-bold text-white">{c.title}</p>
                  <p className="text-[13px] text-white/45 mt-0.5">
                    {c.specHref ? (
                      <>Runtime internals, embedding, self-hosting ·{" "}
                        <a href={c.specHref} target="_blank" rel="noopener noreferrer"
                           onClick={(e) => e.stopPropagation()}
                           className="text-amber-300/60 hover:text-amber-300 transition-colors">
                          v1.1 spec ↗
                        </a>
                      </>
                    ) : c.sub}
                  </p>
                </div>
                <span className="ml-auto text-white/25 group-hover:text-white/60 transition-colors">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA SECTION ────────────────────────────────────────────────────────────
export function CtaSection() {
  return (
    <section className="py-24 px-[5%] bg-[linear-gradient(135deg,#0c1220,#1a2540)] text-center relative overflow-hidden">
      <div className="absolute w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(26,86,219,0.15)_0%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="relative z-10">
        <span className="block font-mono text-[11.5px] tracking-[1.2px] uppercase text-blue-muted mb-4">Start building today</span>
        <h2 className="font-syne text-[clamp(28px,4vw,52px)] font-extrabold tracking-[-1.5px] leading-[1.1] text-white mb-4">
          Your AI should be<br />as <span className="text-blue-muted">accountable</span> as you are
        </h2>
        <p className="text-[17px] text-white/55 mb-9 max-w-[500px] mx-auto">Join researchers, engineers, and enterprises building the next generation of governed AI systems on O-Lang.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/playground" className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-bold text-white bg-grad-blue rounded-[10px] shadow-blue hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(26,86,219,0.5)] transition-all">
            <svg viewBox="0 0 20 20" className="w-4 h-4 fill-white"><path d="M5 3l11 7-11 7V3z"/></svg>
            Open Playground
          </Link>
          <Link href="https://github.com/O-Lang-Central" target="_blank" className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold text-white/80 bg-white/[0.07] border border-white/15 rounded-[10px] hover:bg-white/[0.12] hover:text-white transition-all">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            Star on GitHub
          </Link>
          <Link href="/docs" className="inline-flex items-center gap-2 px-8 py-3.5 text-[15px] font-semibold text-white/80 bg-white/[0.07] border border-white/15 rounded-[10px] hover:bg-white/[0.12] hover:text-white transition-all">Read the docs →</Link>
        </div>
      </div>
    </section>
  );
}