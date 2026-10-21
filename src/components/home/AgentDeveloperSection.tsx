"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function AgentDeveloperSection() {
  return (
    <section id="agent-developers" className="py-24 px-[5%] bg-slate-950 border-t border-slate-900">
      <div className="max-w-[1160px] mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="font-mono text-[11px] text-blue-400 uppercase tracking-[0.4px] mb-4">
            For Agent Builders
          </p>
          <h2 className="font-syne text-[clamp(28px,4vw,48px)] font-extrabold tracking-[-1.5px] text-slate-50 mb-4 leading-[1.1]">
            Make your agent a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">trusted participant</span>
          </h2>
          <p className="text-[16px] text-slate-400 max-w-[680px] mx-auto leading-relaxed">
            Don&apos;t rewrite your core logic. Define your governance contract, expose your capabilities, 
            and let the O-Lang kernel enforce boundaries at every agent-to-agent handoff.
          </p>
        </motion.div>

        {/* 3-Step On-Ramp (Tailored to Agent-to-Agent) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          {/* Step 1: Define */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-[16px] p-6 bg-slate-900 border border-slate-800 hover:border-blue-500/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-[10px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
              <span className="font-syne text-[18px] font-bold text-blue-400">1</span>
            </div>
            <h3 className="font-syne text-[18px] font-bold text-slate-100 mb-2">Define the Contract</h3>
            <p className="text-[14px] text-slate-400 leading-relaxed mb-4">
              Declare exactly what your agent can do, what inputs it requires, and what outputs it guarantees. No hidden behaviors.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-[8px] p-3 font-mono text-[11px] text-slate-300">
              <span className="text-blue-400">{`{`}</span><br/>
              &nbsp;&nbsp;<span className="text-emerald-400">"name"</span>: <span className="text-amber-400">"compliance-agent"</span>,<br/>
              &nbsp;&nbsp;<span className="text-emerald-400">"guaranteed_outputs"</span>: [<span className="text-amber-400">"clearance_status"</span>],<br/>
              &nbsp;&nbsp;<span className="text-emerald-400">"compliance_level"</span>: <span className="text-amber-400">"ndpa-ready"</span><br/>
              <span className="text-blue-400">{`}`}</span>
            </div>
          </motion.div>

          {/* Step 2: Expose */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-[16px] p-6 bg-slate-900 border border-slate-800 hover:border-emerald-500/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
              <span className="font-syne text-[18px] font-bold text-emerald-400">2</span>
            </div>
            <h3 className="font-syne text-[18px] font-bold text-slate-100 mb-2">Expose to the Network</h3>
            <p className="text-[14px] text-slate-400 leading-relaxed mb-4">
              Run the lightweight O-Lang NL-to-OL server. Your agent becomes discoverable, and orchestrators can safely compose it into workflows.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-[8px] p-3 font-mono text-[11px] text-slate-300">
              <span className="text-slate-500">$ node tool/nl-to-ol/server.js</span><br/>
              <span className="text-emerald-400">✓</span> <span className="text-slate-400">Listening on :3100</span><br/>
              <span className="text-emerald-400">✓</span> <span className="text-slate-400">Manifest loaded & grounded</span>
            </div>
          </motion.div>

          {/* Step 3: Enforce */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="rounded-[16px] p-6 bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-[10px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
              <span className="font-syne text-[18px] font-bold text-amber-400">3</span>
            </div>
            <h3 className="font-syne text-[18px] font-bold text-slate-100 mb-2">Enforce at the Edge</h3>
            <p className="text-[14px] text-slate-400 leading-relaxed mb-4">
              Wrap your function with the O-Lang SDK. The kernel intercepts every call, validates inputs against your manifest, and signs the output.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-[8px] p-3 font-mono text-[11px] text-slate-300">
              <span className="text-purple-400">from</span> olang_sdk <span className="text-purple-400">import</span> OLangAgent<br/>
              <br/>
              agent = OLangAgent(<br/>
              &nbsp;&nbsp;fn=my_logic,<br/>
              &nbsp;&nbsp;manifest=<span className="text-amber-400">"manifest.json"</span><br/>
              )
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[18px] bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 p-8 text-center"
        >
          <p className="text-[13px] font-mono text-slate-500 uppercase tracking-widest mb-2">
            Ready to join the governed agentic web?
          </p>
          <p className="text-[15px] text-slate-300 mb-6 max-w-[560px] mx-auto">
            Get the manifest schemas, local registry setup, and Python/JS SDK wrappers to make your agent O-Lang Certified.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/docs/agent-onramp"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-bold text-slate-950 bg-blue-400 rounded-[10px] shadow-[0_0_20px_rgba(96,165,250,0.2)] hover:bg-blue-300 hover:-translate-y-0.5 transition-all"
            >
              View Agent Developer Docs
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <Link
              href="https://github.com/olalekanogundipe/GRaaS-platform/tree/main/tool/manifest"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 text-[15px] font-semibold text-slate-300 bg-slate-900 border border-slate-800 rounded-[10px] hover:bg-slate-800 hover:text-white transition-all"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              View Manifest Examples
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}