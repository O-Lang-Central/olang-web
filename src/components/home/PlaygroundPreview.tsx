"use client";

import Link from "next/link";
import { SectionHeader } from "@/components/ui";

const EDITOR_CODE = `<span class="t-cm">// ICU Admission — Healthcare workflow</span>
<span class="t-kw">workflow</span> <span class="t-fn">icu_admission_v1</span> <span class="t-op">{</span>

  <span class="t-gov">@governance</span> <span class="t-op">{</span>
    <span class="t-key">allowed_resolvers</span><span class="t-op">:</span> <span class="t-op">[</span>
      <span class="t-str">"@o-lang/icu-admission"</span><span class="t-op">,</span>
      <span class="t-str">"@o-lang/llm-groq"</span>
    <span class="t-op">]</span>
    <span class="t-key">scope</span><span class="t-op">:</span>  <span class="t-str">"team-a-icu-only"</span>
    <span class="t-key">prohibited_actions</span><span class="t-op">:</span> <span class="t-op">[</span>
      <span class="t-str">"unauthorized_procedure"</span><span class="t-op">,</span>
      <span class="t-str">"ward_transfer_without_auth"</span>
    <span class="t-op">]</span>
  <span class="t-op">}</span>

  <span class="t-key">step</span> <span class="t-fn">admit</span> <span class="t-op">=</span> <span class="t-str">@o-lang/icu-admission</span><span class="t-op">({</span>
    <span class="t-key">patient_id</span><span class="t-op">:</span> <span class="t-val">$input.patient_id</span><span class="t-op">,</span>
    <span class="t-key">ward</span><span class="t-op">:</span>       <span class="t-val">$input.ward</span><span class="t-op">,</span>
    <span class="t-key">team</span><span class="t-op">:</span>       <span class="t-val">$input.team</span>
  <span class="t-op">})</span>

<span class="t-op">}</span>`;

const CHECKLIST = [
  "Monaco editor with O-Lang syntax highlighting",
  "Real-time execution trace — see every resolver step",
  "Live safety logs and cryptographic audit output",
  "Save and share workflows with a permanent URL",
];

export function PlaygroundPreview() {
  return (
    <section className="py-24 px-[5%]" id="playground">
      <div className="max-w-[1160px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Info side */}
          <div className="lg:pr-6 reveal">
            <SectionHeader
              eyebrow="Playground"
              title={<>Write and run<br />.ol files in your<br />browser</>}
              subtitle="No install. No config. Connect to the O-Lang cloud kernel and execute governed workflows live."
            />
            <ul className="mt-6 mb-8 flex flex-col gap-3">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-ink-3 leading-snug">
                  <span className="w-[22px] h-[22px] rounded-full bg-green-light flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg viewBox="0 0 12 12" fill="none" stroke="#059669" strokeWidth="2" className="w-3 h-3"><path d="M2 6l3 3 5-5"/></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2.5 px-7 py-3 text-[15px] font-semibold text-blue bg-white border-[1.5px] border-blue rounded-[10px] hover:bg-blue-light hover:-translate-y-px transition-all"
            >
              Open full playground
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M4 10h12M10 4l6 6-6 6"/></svg>
            </Link>
          </div>

          {/* Editor mock */}
          <div className="code-window reveal">
            {/* Tabs */}
            <div className="flex items-center border-b border-white/[0.07] px-4">
              {["icu-admission.ol", "output", "audit"].map((t, i) => (
                <span key={t} className={`px-4 py-3 font-mono text-[12px] border-b-2 ${i === 0 ? "text-blue-muted border-blue" : "text-white/35 border-transparent"}`}>{t}</span>
              ))}
            </div>

            {/* Code */}
            <div className="px-[22px] py-5 font-mono text-[13px] leading-[1.75] text-white/80 min-h-[260px]">
              <pre dangerouslySetInnerHTML={{ __html: EDITOR_CODE }} />
            </div>

            {/* Run bar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.07] bg-black/20">
              <Link
                href="/playground"
                className="inline-flex items-center gap-2 px-4 py-1.5 text-[13px] font-bold text-white bg-grad-blue rounded-[7px] shadow-blue hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(26,86,219,0.45)] transition-all"
              >
                <svg viewBox="0 0 14 14" fill="white" className="w-3 h-3"><path d="M3 2l9 5-9 5V2z"/></svg>
                Run workflow
              </Link>
              <span className="font-mono text-[11px] text-white/25 tracking-[0.3px]">cloud kernel · v1.1.0</span>
            </div>

            {/* Output */}
            <div className="px-[22px] py-3.5 border-t border-white/[0.07] font-mono text-[12.5px] space-y-1">
              <div className="flex items-baseline gap-2.5">
                <span className="text-[10px] text-white/25 uppercase tracking-[0.8px] flex-shrink-0">step 1</span>
                <span className="text-purple-muted">@o-lang/icu-admission → ALLOWED ✓</span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-[10px] text-white/25 uppercase tracking-[0.8px] flex-shrink-0">output</span>
                <span className="text-green-muted">Patient P-00789 admitted to ICU · Bed ICU-2 assigned</span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-[10px] text-white/25 uppercase tracking-[0.8px] flex-shrink-0">audit</span>
                <span className="text-white/35 text-[11px]">sha3-256:7a8b9c0d1e2f… · ed25519 signed · 318ms</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
