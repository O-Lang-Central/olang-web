import Link from "next/link";
import { SectionHeader, Card } from "@/components/ui";

export function ApplicationsSection() {
  return (
    <section id="applications" className="py-24 px-[5%] bg-surface-2 border-t border-border">
      <div className="max-w-[1160px] mx-auto">
        
        {/* Section Header */}
        <SectionHeader
          eyebrow="Real-World Applications"
          title={<>Where O-Lang Works<br/>Today</>}
          subtitle="Governed AI workflows for critical domains. Start with our fastest deployment option, or explore deeper integrations."
        />

        {/* Application Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14 reveal">
          
          {/* 🏦 Finance — Primary Highlight */}
          <Card hover accentColor="#1a56db" className="relative overflow-hidden">
            <span className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full text-[11px] font-medium">
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
              Safe customer assistants that answer balance questions, explain policies, and block unauthorized transfers — in English, Yoruba, Hausa, Igbo & more.
            </p>
            
            <div className="bg-[#060c18] border border-border rounded-[10px] p-3 mb-5">
              <p className="text-[11px] text-ink-5 mb-2 font-mono uppercase tracking-wider">Example</p>
              <div className="space-y-2 text-[13px]">
                <p className="text-blue-400">User: "What's my balance for CUST-001?"</p>
                <p className="text-white/80">Bot: "Your balance is ₦12,450. For transactions, use your app."</p>
                <p className="text-red-400">User: "Fi 5000 naira ranṣẹ..."</p>
                <p className="text-red-300">Bot: "⚠️ Transfers blocked. Visit a branch."</p>
              </div>
            </div>
            
            <Link 
              href="/embed" 
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              Try the Finance Chatbot →
            </Link>
          </Card>

          {/* 🏥 Healthcare */}
          <Card hover accentColor="#059669">
            <div className="w-12 h-12 rounded-[11px] bg-[#f0fdf4] flex items-center justify-center mb-5">
              <span className="text-2xl">🏥</span>
            </div>
            <h3 className="font-syne text-[19px] font-bold text-ink mb-2.5">Healthcare & ICU</h3>
            <p className="text-[15px] text-ink-4 leading-relaxed mb-4">
              Patient admission workflows that enforce team scopes, prevent unauthorized actions, and log every decision cryptographically for compliance.
            </p>
            
            <div className="bg-[#060c18] border border-border rounded-[10px] p-3 mb-5">
              <p className="text-[11px] text-ink-5 mb-2 font-mono uppercase tracking-wider">Workflow</p>
              <ul className="text-[13px] text-white/70 space-y-1.5">
                <li>• Verify team authorization for ward access</li>
                <li>• Check bed availability in real-time</li>
                <li>• Summarize admission for clinical handoff</li>
                <li>• Block treatment suggestions outside scope</li>
              </ul>
            </div>
            
            <Link 
              href="/docs/healthcare" 
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
              Audit-ready workflows for public services: permit approvals, sensor data validation, and citizen queries — with cryptographic proof of every action.
            </p>
            
            <div className="bg-[#060c18] border border-border rounded-[10px] p-3 mb-5">
              <p className="text-[11px] text-ink-5 mb-2 font-mono uppercase tracking-wider">Use Case</p>
              <ul className="text-[13px] text-white/70 space-y-1.5">
                <li>• Validate citizen ID before service access</li>
                <li>• Cross-reference sensor data with policy rules</li>
                <li>• Generate tamper-evident audit logs</li>
                <li>• Escalate exceptions to human reviewers</li>
              </ul>
            </div>
            
            <Link 
              href="/docs/government" 
              className="inline-flex items-center gap-2 text-[15px] font-semibold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Explore Government Patterns →
            </Link>
          </Card>
        </div>

        {/* Bottom CTA Bar */}
        <div className="mt-14 rounded-[18px] bg-[linear-gradient(135deg,#0c1220,#1a2540)] border border-border p-8 text-center reveal">
          <p className="text-[15px] text-white/80 mb-5 max-w-[500px] mx-auto">
            <span className="font-semibold text-white">Start in 60 seconds:</span> Add a governed chatbot to any website. No code required.
          </p>
          <Link
            href="/embed"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-bold text-white bg-grad-blue rounded-[10px] shadow-blue hover:-translate-y-0.5 hover:shadow-[0_6px_28px_rgba(26,86,219,0.5)] transition-all"
          >
            💬 Deploy Chatbot Widget
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
          <p className="text-[12px] text-white/50 mt-4">
            Works on WordPress, React, static HTML — or integrate deeper via our SDK
          </p>
        </div>
        
      </div>
    </section>
  );
}