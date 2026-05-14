import Link from "next/link";
import { SectionHeader, Card } from "@/components/ui";

export function ApplicationsSection() {
  return (
    <section id="applications" className="py-24 px-[5%] bg-surface-2 border-t border-border">
      <div className="max-w-[1160px] mx-auto">

        {/* Section Header */}
        <SectionHeader
          eyebrow="Real-World Applications"
          title={<>Where O-Lang Works<br />Today</>}
          subtitle="Governed AI workflows for critical domains. Built for the world's most demanding deployment conditions — multilingual populations, fragmented regulation, zero-tolerance compliance."
        />

        {/* ── Origin story strip ── */}
        <div className="mt-10 mb-14 rounded-[14px] border border-border bg-[linear-gradient(135deg,rgba(26,86,219,0.06),rgba(124,58,237,0.04))] px-6 py-5 flex flex-col md:flex-row items-start md:items-center gap-4 reveal">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-[9px] bg-blue/10 border border-blue/20 flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" stroke="rgba(96,165,250,0.7)" strokeWidth="1.4"/>
                <path d="M6.5 10.5l2.5 2.5 4.5-5" stroke="rgba(96,165,250,0.9)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-mono text-[11px] text-white/40 uppercase tracking-widest">Why O-Lang exists</span>
          </div>
          <p className="text-[14px] text-ink-4 leading-relaxed">
            Complex financial systems, 500+ languages, fragmented regulation, and high-stakes compliance — these conditions
            forced us to build governance features that every enterprise globally needs but hasn&apos;t demanded yet.{" "}
            <span className="text-white/60 font-medium">Africa surfaced the problem. O-Lang solves it for everyone.</span>
          </p>
        </div>

        {/* Application Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 reveal">

          {/* 🏦 Finance */}
          <Card hover accentColor="#1a56db" className="relative overflow-hidden">
            <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/90 border border-white/60 text-gray-800 rounded-full text-[13px] font-medium">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              60-Second Deploy
            </span>
            <div className="w-12 h-12 rounded-[11px] bg-[#eff6ff] flex items-center justify-center mb-5">
              <span className="text-2xl">🏦</span>
            </div>
            <h3 className="font-syne text-[19px] font-bold text-ink mb-2.5">Financial Services</h3>
            <p className="text-[15px] text-ink-4 leading-relaxed mb-4">
              Safe customer assistants that answer balance questions, explain policies, and block unauthorized transfers —
              with locale-aware formatting across any currency and language, out of the box.
            </p>

            <div className="bg-[#060c18] border border-border rounded-[10px] p-3 mb-5">
              <p className="text-[11px] text-ink-5 mb-2 font-mono uppercase tracking-wider">Same workflow · any locale</p>
              <div className="space-y-1.5 text-[12px] font-mono">
                <div className="flex items-center gap-2">
                  <span>🇺🇸</span>
                  <span className="text-white/35 w-12">en-US</span>
                  <span className="text-green-muted">"Balance is $12,450.00"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🇳🇬</span>
                  <span className="text-white/35 w-12">en-NG</span>
                  <span className="text-emerald-400">"Balance is ₦12,450.00"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🇫🇷</span>
                  <span className="text-white/35 w-12">fr-FR</span>
                  <span className="text-blue-400">"Solde : 12 450,00 €"</span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-red-400">User (Yoruba): "Fi 5000 naira ranṣẹ..."</span>
                </div>
                <div>
                  <span className="text-red-300">Bot: "⚠️ Transfers blocked. Visit a branch."</span>
                </div>
              </div>
            </div>

            <Link
              href="/embed"
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Deploy Finance Chatbot →
            </Link>
          </Card>

          {/* 🏥 Healthcare */}
          <Card hover accentColor="#059669">
            <div className="w-12 h-12 rounded-[11px] bg-[#f0fdf4] flex items-center justify-center mb-5">
              <span className="text-2xl">🏥</span>
            </div>
            <h3 className="font-syne text-[19px] font-bold text-ink mb-2.5">Healthcare & ICU</h3>
            <p className="text-[15px] text-ink-4 leading-relaxed mb-4">
              Patient admission workflows that enforce team scopes, prevent unauthorized actions, and log every
              decision cryptographically — built for compliance whether you&apos;re in Lagos, London, or Los Angeles.
            </p>

            <div className="bg-[#060c18] border border-border rounded-[10px] p-3 mb-5">
              <p className="text-[11px] text-ink-5 mb-2 font-mono uppercase tracking-wider">Workflow</p>
              <ul className="text-[13px] text-white/70 space-y-1.5">
                <li>• Verify team authorization for ward access</li>
                <li>• Check bed availability in real-time</li>
                <li>• Summarize admission for clinical handoff</li>
                <li>• Block treatment suggestions outside scope</li>
                <li>• Cryptographic log for every decision</li>
              </ul>
            </div>

            <Link
              href="/playground?domain=healthcare"
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              See Healthcare Workflows →
            </Link>
          </Card>

          {/* 🏛️ Government / IoT */}
          <Card hover accentColor="#7c3aed">
            <div className="w-12 h-12 rounded-[11px] bg-[#faf5ff] flex items-center justify-center mb-5">
              <span className="text-2xl">🏛️</span>
            </div>
            <h3 className="font-syne text-[19px] font-bold text-ink mb-2.5">Government & IoT</h3>
            <p className="text-[15px] text-ink-4 leading-relaxed mb-4">
              Audit-ready workflows for public services: permit approvals, sensor data validation, and citizen
              queries — with cryptographic proof of every action, across any language or jurisdiction.
            </p>

            <div className="bg-[#060c18] border border-border rounded-[10px] p-3 mb-5">
              <p className="text-[11px] text-ink-5 mb-2 font-mono uppercase tracking-wider">Use Case</p>
              <ul className="text-[13px] text-white/70 space-y-1.5">
                <li>• Validate citizen ID before service access</li>
                <li>• Cross-reference sensor data with policy rules</li>
                <li>• Generate tamper-evident audit logs</li>
                <li>• Escalate exceptions to human reviewers</li>
                <li>• GDPR, NDPR & ISO 42001 aligned by default</li>
              </ul>
            </div>

            <Link
              href="/playground?domain=government"
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Explore Government Patterns →
            </Link>
          </Card>
        </div>

        {/* ── Global proof strip ── */}
        <div className="mt-10 rounded-[14px] border border-border bg-white/[0.02] px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 reveal">
          {[
            { stat: "9 countries", label: "active users" },
            { stat: "20+ languages", label: "PII redaction" },
            { stat: "MIT Licensed", label: "open source" },
            { stat: "ISO 42001", label: "AI governance aligned" },
            { stat: "Merkle + RSA", label: "signed audit trail" },
          ].map(({ stat, label }) => (
            <div key={stat} className="flex items-center gap-2 text-center">
              <span className="font-syne font-bold text-[15px] text-white/80">{stat}</span>
              <span className="text-[12px] text-white/30">{label}</span>
            </div>
          ))}
        </div>

        {/* Bottom CTA Bar */}
        <div className="mt-8 rounded-[18px] bg-[linear-gradient(135deg,#0c1220,#1a2540)] border border-border p-8 text-center reveal">
          <p className="text-[13px] font-mono text-white/35 uppercase tracking-widest mb-2">
            Built for complexity · Deployable everywhere
          </p>
          <p className="text-[15px] text-white/80 mb-5 max-w-[560px] mx-auto">
            <span className="font-semibold text-white">Add a governed chatbot to any website in 3 minutes.</span>{" "}
            No framework required. Works on WordPress, React, static HTML — or integrate deeper via the SDK.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/embed"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-bold text-white bg-grad-blue rounded-[10px] shadow-blue hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(26,86,219,0.5)] transition-all"
            >
              💬 Deploy Chatbot Widget
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="https://github.com/orgs/O-Lang-Central"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-semibold text-white/75 bg-white/[0.06] border border-white/15 rounded-[10px] hover:bg-white/10 hover:text-white transition-all"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              View on GitHub
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}