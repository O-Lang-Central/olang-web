"use client";

import Link from "next/link";
import { useState } from "react";

const C = {
  kw:  "#818cf8",
  res: "#34d399",
  val: "#fbbf24",
  cm:  "#ffffff40",
  str: "#ffffff",
  num: "#f87171",
};

function CodeBlock({ filename, children }: { filename: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-[12px] bg-[#0d1117] border border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.07] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28ca41]" />
          </div>
          <span className="font-mono text-[11.5px] text-white/35 ml-1">{filename}</span>
        </div>
        <button
          onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }}
          className="font-mono text-[10.5px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5"
        >
          {copied ? (
            <><svg viewBox="0 0 12 12" fill="none" stroke="#34d399" strokeWidth="2" className="w-3 h-3"><path d="M2 6l3 3 5-5"/></svg><span className="text-green-400">copied</span></>
          ) : (
            <><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3"><rect x="3" y="3" width="6" height="6" rx="1"/><path d="M5 1H3a1 1 0 00-1 1v2"/></svg>copy</>
          )}
        </button>
      </div>
      <div className="px-5 py-5 overflow-x-auto">
        <pre className="font-mono text-[13.5px] leading-[1.95]">{children}</pre>
      </div>
    </div>
  );
}

function KW({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-[13px] bg-[#1e1b4b] text-[#818cf8] border border-[#3730a3]/40 px-1.5 py-0.5 rounded-[5px]">
      {children}
    </code>
  );
}

function Section({ id, label, color, children }: { id: string; label: string; color: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 mb-20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-7 rounded-full flex-shrink-0" style={{ background: color }} />
        <h2 className="font-syne text-[22px] font-extrabold text-ink tracking-[-0.5px]">{label}</h2>
        <a href={`#${id}`} className="text-ink-5 hover:text-ink-4 transition-colors ml-1">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
            <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3M9 1h6m0 0v6m0-6L7 9"/>
          </svg>
        </a>
      </div>
      {children}
    </section>
  );
}

const NAV = [
  { id: "overview",    label: "Overview" },
  { id: "structure",   label: "File structure" },
  { id: "keywords",    label: "Keyword reference" },
  { id: "variables",   label: "Variables & context" },
  { id: "resolvers",   label: "Allow resolvers" },
  { id: "steps",       label: "Steps & Ask" },
  { id: "control",     label: "Control flow" },
  { id: "parallel",    label: "Parallel & escalation" },
  { id: "advanced",    label: "Advanced statements" },
  { id: "constraints", label: "Constraints" },
  { id: "examples",    label: "Full examples" },
  { id: "cheatsheet",  label: "Cheatsheet" },
];

export default function SyntaxPage() {
  const [active, setActive] = useState("overview");

  return (
    <div className="min-h-screen bg-surface-2 pt-16">

      {/* ── Hero ── */}
      <div className="bg-grad-hero px-[5%] py-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-grid opacity-[0.04] pointer-events-none" />
        <div className="max-w-[1160px] mx-auto relative z-10">
          <span className="font-mono text-[11px] tracking-[1.4px] uppercase text-blue-muted block mb-3">Language Reference</span>
          <h1 className="font-syne text-[42px] font-extrabold tracking-[-1.5px] text-white leading-tight mb-3">
            O-Lang Syntax
          </h1>
          <p className="text-white/55 text-[17px] max-w-[560px] leading-relaxed mb-5">
            The complete, accurate reference for <code className="font-mono text-blue-muted bg-white/[0.08] px-1.5 py-0.5 rounded text-[15px]">.ol</code> files —
            derived directly from the kernel parser and runtime.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/playground" className="inline-flex items-center gap-2 px-4 py-2 bg-blue text-white text-[13px] font-semibold rounded-[9px] hover:opacity-90 transition-opacity">
              <svg viewBox="0 0 16 16" fill="white" className="w-3 h-3"><path d="M4 2l9 6-9 6V2z"/></svg>
              Try in Playground
            </Link>
            <Link href="/docs" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white text-[13px] font-semibold rounded-[9px] hover:bg-white/15 transition-colors">
              Full docs →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-[1160px] mx-auto px-[5%] py-12 flex gap-10 items-start">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-1 w-[210px] flex-shrink-0 sticky top-24">
          <p className="font-mono text-[10.5px] text-ink-5 uppercase tracking-widest mb-2 px-2">On this page</p>
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} onClick={() => setActive(n.id)}
              className={`text-[13px] px-3 py-1.5 rounded-[8px] transition-all ${
                active === n.id
                  ? "font-semibold text-ink bg-white border border-border shadow-sm"
                  : "text-ink-4 hover:text-ink hover:bg-white/60"
              }`}>
              {n.label}
            </a>
          ))}
          <div className="mt-6 pt-5 border-t border-border">
            <p className="font-mono text-[10.5px] text-ink-5 uppercase tracking-widest mb-2 px-2">Jump to</p>
            <Link href="/playground" className="text-[13px] text-blue px-3 py-1.5 block hover:underline">Playground ↗</Link>
            <Link href="/docs" className="text-[13px] text-blue px-3 py-1.5 block hover:underline">Docs ↗</Link>
            <Link href="/registry" className="text-[13px] text-blue px-3 py-1.5 block hover:underline">Tool Registry ↗</Link>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">

          {/* ── OVERVIEW ── */}
          <Section id="overview" label="Overview" color="#1a56db">
            <p className="text-[15px] text-ink-4 leading-relaxed mb-5">
              O-Lang uses a format called <strong className="text-ink font-semibold">Linear Declarative Workflow Form (LDWF)</strong>.
              Workflows are read and executed top-to-bottom. Each statement expresses intent — the kernel handles execution,
              validation, resolver dispatch, and cryptographic audit logging.
            </p>
            <div className="grid grid-cols-3 gap-4 mb-5">
              {[
                { n: "linear",       label: "top-to-bottom execution",  color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe" },
                { n: "declarative",  label: "intent, not mechanics",     color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
                { n: ".ol",          label: "file extension",            color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff" },
              ].map((s) => (
                <div key={s.label} className="rounded-[12px] p-5 border text-center" style={{ background: s.bg, borderColor: s.border }}>
                  <p className="font-syne text-[20px] font-extrabold leading-none mb-1" style={{ color: s.color }}>{s.n}</p>
                  <p className="text-[12px] text-ink-4">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[10px] bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.6" className="w-4 h-4 flex-shrink-0 mt-0.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 10.5v.5"/></svg>
              <p className="text-[13px] text-amber-800 leading-relaxed">
                This reference is derived directly from the kernel parser and runtime source.
                Every keyword and syntax pattern shown here is verified against actual parser regex and handler logic.
              </p>
            </div>
          </Section>

          {/* ── FILE STRUCTURE ── */}
          <Section id="structure" label="File structure" color="#1a56db">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-5">
              Every <KW>.ol</KW> file has three regions in this order. Blank lines between steps are required for readability and encouraged by the spec.
              Indentation is <strong className="text-ink font-semibold">semantic-neutral</strong> — execution never depends on it.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {[
                { n: "1", label: "Declaration",    color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe",
                  desc: "Workflow name and input variables. Parsed first." },
                { n: "2", label: "Allow resolvers", color: "#7c3aed", bg: "#faf5ff", border: "#e9d5ff",
                  desc: "Explicit allowlist. Only listed resolvers may be invoked. Required." },
                { n: "3", label: "Steps",           color: "#059669", bg: "#f0fdf4", border: "#bbf7d0",
                  desc: "Execution steps in monotonically increasing numeric order." },
              ].map((r) => (
                <div key={r.n} className="rounded-[10px] p-4 border" style={{ background: r.bg, borderColor: r.border }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-syne text-[22px] font-extrabold leading-none" style={{ color: r.color }}>{r.n}</span>
                    <span className="font-syne font-bold text-[14px] text-ink">{r.label}</span>
                  </div>
                  <p className="text-[13px] text-ink-4 leading-relaxed">{r.desc}</p>
                </div>
              ))}
            </div>
            <CodeBlock filename="structure.ol">
<span style={{color:C.cm}}>{`# ── 1. DECLARATION ────────────────────────────────────\n`}</span>
<span style={{color:C.kw}}>Workflow</span><span style={{color:C.str}}>{` "Workflow Name" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` input_a, input_b\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# ── 2. RESOLVER ALLOWLIST ─────────────────────────────\n`}</span>
<span style={{color:C.kw}}>{`Allow resolvers:\n`}</span>
<span style={{color:C.res}}>{`  ToolA\n`}</span>
<span style={{color:C.res}}>{`  ToolB\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# ── 3. STEPS ──────────────────────────────────────────\n`}</span>
<span style={{color:C.kw}}>Step 1</span><span style={{color:C.str}}>{`: Ask ToolA "{input_a}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` result_a\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 2</span><span style={{color:C.str}}>{`: Ask ToolB "{result_a.field} and {input_b}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` result_b\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Return</span><span style={{color:C.val}}>{` result_b`}</span>
            </CodeBlock>
          </Section>

          {/* ── KEYWORD REFERENCE ── */}
          <Section id="keywords" label="Keyword reference" color="#059669">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-5">
              All keywords verified against the kernel parser. Keywords are <strong className="text-ink font-semibold">case-insensitive</strong> in the parser
              (regex uses <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">/i</code> flag throughout)
              but the convention is to write them with capital first letters as shown.
            </p>
            <div className="border border-border rounded-[14px] overflow-hidden shadow-sm">
              <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr className="bg-surface-3 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-ink w-[200px]">Keyword / Statement</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink w-[100px]">Region</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Workflow ... with ...",        "Header",    "#1a56db", "Declares workflow name and comma-separated input variable names."],
                    ["Allow resolvers:",             "Header",    "#7c3aed", "Opens the resolver allowlist block. Required. Only resolvers listed here may run."],
                    ["- ResolverName",               "Allowlist", "#7c3aed", "Adds a resolver to the allowlist. Parser accepts both '- Name' and bare 'Name' entries."],
                    ["Constraint: key = value",      "Header",    "#0891b2", "Workflow-level constraint. Currently: max_generations = N."],
                    ["Step N: Ask Resolver \"...\"", "Steps",     "#059669", "Numbered step. Calls a resolver with an interpolated prompt. N must increase monotonically."],
                    ["Save as variable",             "Steps",     "#059669", "Binds the step output to a named context variable. Available to all subsequent steps."],
                    ["Return var1, var2",            "Steps",     "#059669", "Declares workflow output(s). Comma-separated. Must be the last statement."],
                    ["If {var} equals \"val\" then", "Steps",     "#d97706", "Conditional block. Condition uses {curly braces} and keyword operators."],
                    ["End If",                       "Steps",     "#d97706", "Closes an If block. Required — scope is keyword-defined, not indentation-defined."],
                    ["Run in parallel",              "Steps",     "#dc2626", "Opens a parallel execution block. All inner steps run concurrently."],
                    ["Run in parallel for Ns",       "Steps",     "#dc2626", "Parallel block with timeout. N is a number, s/m/h/d is the time unit."],
                    ["Run in parallel with escalation:", "Steps", "#dc2626", "Opens an escalation block. Levels execute sequentially with timeouts."],
                    ["Level N: description",         "Escalation","#dc2626", "Declares an escalation level with optional timeout parsed from description."],
                    ["End",                          "Steps",     "#dc2626", "Closes a parallel or escalation block."],
                    ["Use ToolName",                 "Steps",     "#059669", "Invokes a tool without a prompt string. Distinct from Ask."],
                    ["Debrief Agent with \"msg\"",   "Steps",     "#7c3aed", "Sends a debrief message to a named agent. Emits a 'debrief' event."],
                    ["Evolve @resolver using feedback: \"...\"", "Steps", "#7c3aed", "Requests resolver evolution with feedback. Emits evolution metadata."],
                    ["Prompt user to \"question\"",  "Steps",     "#0891b2", "Declares a user prompt step. Output not automatically saved."],
                    ["Persist var to \"path\"",      "Steps",     "#0891b2", "Writes a context variable to a file. JSON files serialized automatically."],
                    ["Emit \"event\" with payload",  "Steps",     "#0891b2", "Emits a named event with an interpolated payload string."],
                    ["Constraint: key = value",      "Step",      "#0891b2", "Per-step constraint (e.g. max_time_sec, cost_limit, allowed_resolvers)."],
                  ].map(([kw, region, color, purpose], i) => (
                    <tr key={i} className={i > 0 ? "border-t border-border" : ""}>
                      <td className="px-4 py-2.5 font-mono font-semibold text-[12.5px]" style={{ color: color as string }}>{kw}</td>
                      <td className="px-4 py-2.5 text-[11.5px] text-ink-5">{region}</td>
                      <td className="px-4 py-2.5 text-ink-4 leading-relaxed text-[12.5px]">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* ── VARIABLES ── */}
          <Section id="variables" label="Variables & context" color="#059669">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-5">
              The kernel maintains a <strong className="text-ink font-semibold">context object</strong> that grows throughout execution.
              Variables declared with <KW>with</KW> are seeded at start. Each <KW>Save as</KW> appends to context —
              nothing is ever overwritten. Dot-path notation accesses nested fields inside saved objects.
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {[
                { syntax: "{input_name}",     label: "Runtime input",   desc: "Declared in the with clause. Available from Step 1.", color: "#1a56db" },
                { syntax: "{saved_var}",      label: "Saved output",    desc: "The full output object of a previous Save as step.", color: "#059669" },
                { syntax: "{saved_var.field}",label: "Dot-path access", desc: "A specific field inside a saved output. Supports multiple levels: {a.b.c}.", color: "#7c3aed" },
              ].map((v) => (
                <div key={v.syntax} className="flex items-start gap-4 bg-white border border-border rounded-[10px] px-4 py-3.5">
                  <code className="font-mono text-[13.5px] font-semibold flex-shrink-0 w-[210px]" style={{ color: v.color }}>{v.syntax}</code>
                  <div>
                    <p className="text-[13px] font-semibold text-ink mb-0.5">{v.label}</p>
                    <p className="text-[13px] text-ink-4">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-[10px] bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2.5 mb-5">
              <svg viewBox="0 0 16 16" fill="none" stroke="#dc2626" strokeWidth="1.6" className="w-4 h-4 flex-shrink-0 mt-0.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 10.5v.5"/></svg>
              <p className="text-[13px] text-red-800 leading-relaxed">
                <strong className="font-semibold">Object interpolation is blocked by the kernel.</strong> You cannot use <code className="font-mono text-[12px]">{"{account}"}</code> directly in a prompt if <code className="font-mono text-[12px]">account</code> is an object — the kernel throws a safety error to prevent data corruption into LLM prompts. Always use dot-path: <code className="font-mono text-[12px]">{"{account.balance}"}</code>.
              </p>
            </div>
            <CodeBlock filename="variables.ol">
<span style={{color:C.kw}}>Workflow</span><span style={{color:C.str}}>{` "Invoice Check" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` invoice_id, question\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`Allow resolvers:\n`}</span>
<span style={{color:C.res}}>{`  InvoiceLookup\n`}</span>
<span style={{color:C.res}}>{`  VendorLookup\n`}</span>
<span style={{color:C.res}}>{`  GroqLLM\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 1</span><span style={{color:C.str}}>{`: Ask InvoiceLookup "{invoice_id}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` invoice\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# {invoice.vendor_id} — dot-path into the Step 1 output object\n`}</span>
<span style={{color:C.kw}}>Step 2</span><span style={{color:C.str}}>{`: Ask VendorLookup "{invoice.vendor_id}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` vendor\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# {question} — runtime input   {invoice.amount} — dot-path   {vendor.name} — dot-path\n`}</span>
<span style={{color:C.kw}}>Step 3</span><span style={{color:C.str}}>{`: Ask GroqLLM "{question}. Amount: {invoice.amount}. Vendor: {vendor.name}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` answer\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Return</span><span style={{color:C.val}}>{` answer`}</span>
            </CodeBlock>
          </Section>

          {/* ── ALLOW RESOLVERS ── */}
          <Section id="resolvers" label="Allow resolvers" color="#7c3aed">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-5">
              The <KW>Allow resolvers:</KW> block is an <strong className="text-ink font-semibold">explicit allowlist</strong>.
              The kernel loads it before Step 1 and enforces it on every resolver call.
              Any resolver not in this list is blocked, logged to <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">logs/disallowed_resolvers.json</code>,
              and written to the cryptographic audit trail as a <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">security_violation</code> event.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="rounded-[10px] bg-green-50 border border-green-200 p-4">
                <p className="font-semibold text-[13px] text-green-800 mb-2">Both formats are accepted by the parser</p>
                <CodeBlock filename="">
<span style={{color:C.kw}}>{`Allow resolvers:\n`}</span>
<span style={{color:C.res}}>{`  - GroqLLM\n`}</span>
<span style={{color:C.res}}>{`  - Extractor\n`}</span>
                </CodeBlock>
                <p className="text-[12px] text-green-700 mt-2">With leading dash (recommended)</p>
              </div>
              <div className="rounded-[10px] bg-green-50 border border-green-200 p-4">
                <p className="font-semibold text-[13px] text-green-800 mb-2">Bare names also valid</p>
                <CodeBlock filename="">
<span style={{color:C.kw}}>{`Allow resolvers:\n`}</span>
<span style={{color:C.res}}>{`  GroqLLM\n`}</span>
<span style={{color:C.res}}>{`  Extractor\n`}</span>
                </CodeBlock>
                <p className="text-[12px] text-green-700 mt-2">Without leading dash</p>
              </div>
            </div>
            <div className="rounded-[10px] bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.6" className="w-4 h-4 flex-shrink-0 mt-0.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 10.5v.5"/></svg>
              <p className="text-[13px] text-amber-800 leading-relaxed">
                The built-in math resolver (<code className="font-mono text-[12px]">builtInMathResolver</code>) is added to the allowlist automatically
                when the kernel detects math keywords (<code className="font-mono text-[12px]">Add</code>, <code className="font-mono text-[12px]">Sum</code>, <code className="font-mono text-[12px]">Avg</code>, etc.) in step actions.
                You do not need to list it manually.
              </p>
            </div>
          </Section>

          {/* ── STEPS & ASK ── */}
          <Section id="steps" label="Steps & Ask" color="#059669">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-5">
              Steps execute in ascending numeric order. Step numbers must be
              <strong className="text-ink font-semibold"> monotonically increasing</strong> (gaps are allowed but discouraged).
              Each step makes one resolver call — either via <KW>Ask</KW> (with a prompt string) or <KW>Use</KW> (tool invocation without prompt).
            </p>

            {/* Step anatomy */}
            <div className="rounded-[12px] bg-surface-3 border border-border p-5 mb-5 font-mono text-[13.5px] leading-[2.4]">
              <div>
                <span style={{color:C.kw}}>Step N</span>
                <span style={{color:C.str}}>: Ask </span>
                <span style={{color:C.res}}>ResolverName</span>
                <span style={{color:C.val}}>{' "prompt with {variable} interpolation"'}</span>
              </div>
              <div>
                <span style={{color:C.kw}}>Save as</span>
                <span style={{color:C.val}}> variable_name</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              {[
                { part: "Step N:",        color: "#818cf8", desc: "N is a positive integer. Steps execute in order. Numbers must only increase." },
                { part: "Ask",            color: "#818cf8", desc: "Calls the named resolver with the prompt. The kernel prepends 'Action' internally before dispatch." },
                { part: "ResolverName",   color: "#34d399", desc: "Must appear in the Allow resolvers: block. Blocked and audit-logged if not listed." },
                { part: '\"prompt\"',     color: "#fbbf24", desc: "Prompt string. {variable} references are interpolated from context before the call is made." },
                { part: "Save as name",   color: "#fbbf24", desc: "Saves the resolver's unwrapped output to context as 'name'. Available to all subsequent steps." },
              ].map((p) => (
                <div key={p.part} className="flex items-start gap-3 bg-white border border-border rounded-[10px] px-4 py-3">
                  <code className="font-mono text-[13px] font-semibold flex-shrink-0 w-[150px]" style={{ color: p.color }}>{p.part}</code>
                  <p className="text-[13px] text-ink-4 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-[14px] text-ink-4 mb-3"><strong className="text-ink font-semibold">Use</strong> — invoke a tool without a prompt string:</p>
            <CodeBlock filename="use-example.ol">
<span style={{color:C.kw}}>Step 3</span><span style={{color:C.str}}>{`: `}</span><span style={{color:C.kw}}>Use</span><span style={{color:C.res}}>{` NotifySystem\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` notification_result`}</span>
            </CodeBlock>
          </Section>

          {/* ── CONTROL FLOW ── */}
          <Section id="control" label="Control flow" color="#d97706">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-5">
              O-Lang supports <strong className="text-ink font-semibold">explicit conditional branching</strong> via <KW>If</KW> / <KW>End If</KW>.
              Scope is defined by keywords, never by indentation.
              The condition must reference a context variable in curly braces and use one of three comparison operators.
            </p>

            {/* Condition syntax */}
            <div className="rounded-[12px] bg-surface-3 border border-border p-5 mb-5 font-mono text-[13.5px] leading-[2.6]">
              <div>
                <span style={{color:C.kw}}>If </span>
                <span style={{color:C.val}}>{"{variable.field}"}</span>
                <span style={{color:C.kw}}> equals </span>
                <span style={{color:C.str}}>"string value"</span>
                <span style={{color:C.kw}}> then</span>
              </div>
              <div>
                <span style={{color:C.kw}}>If </span>
                <span style={{color:C.val}}>{"{variable.score}"}</span>
                <span style={{color:C.kw}}> greater than </span>
                <span style={{color:C.num}}>80</span>
                <span style={{color:C.kw}}> then</span>
              </div>
              <div>
                <span style={{color:C.kw}}>If </span>
                <span style={{color:C.val}}>{"{variable.count}"}</span>
                <span style={{color:C.kw}}> less than </span>
                <span style={{color:C.num}}>5</span>
                <span style={{color:C.kw}}> then</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-6">
              {[
                { op: "equals \"value\"",    desc: "String equality check. Value must be quoted." },
                { op: "greater than N",      desc: "Numeric greater-than. N is an unquoted number." },
                { op: "less than N",         desc: "Numeric less-than. N is an unquoted number." },
                { op: "End If",              desc: "Closes the block. Required. No implicit closing by indentation." },
              ].map((o) => (
                <div key={o.op} className="flex items-start gap-3 bg-white border border-border rounded-[10px] px-4 py-3">
                  <code className="font-mono text-[13px] font-semibold text-[#818cf8] flex-shrink-0 w-[180px]">{o.op}</code>
                  <p className="text-[13px] text-ink-4">{o.desc}</p>
                </div>
              ))}
            </div>

            <div className="rounded-[10px] bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-2.5 mb-6">
              <svg viewBox="0 0 16 16" fill="none" stroke="#d97706" strokeWidth="1.6" className="w-4 h-4 flex-shrink-0 mt-0.5"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 10.5v.5"/></svg>
              <p className="text-[13px] text-amber-800">
                <strong className="font-semibold">There is no Else branch.</strong> The parser supports <KW>If</KW> / <KW>End If</KW> only.
                For two-path branching, use two sequential <KW>If</KW> blocks with inverse conditions.
              </p>
            </div>

            <CodeBlock filename="control-flow.ol">
<span style={{color:C.kw}}>Workflow</span><span style={{color:C.str}}>{` "Risk Triage" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` account_id\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`Allow resolvers:\n`}</span>
<span style={{color:C.res}}>{`  RiskClassifier\n`}</span>
<span style={{color:C.res}}>{`  ComplianceAlert\n`}</span>
<span style={{color:C.res}}>{`  GroqLLM\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 1</span><span style={{color:C.str}}>{`: Ask RiskClassifier "{account_id}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` risk\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# Condition: {curly braces} + operator keyword + value\n`}</span>
<span style={{color:C.kw}}>{`If `}</span><span style={{color:C.val}}>{`{risk.score}`}</span><span style={{color:C.kw}}>{` greater than `}</span><span style={{color:C.num}}>80</span><span style={{color:C.kw}}>{` then\n`}</span>
<span style={{color:C.str}}>{`  Step 2: Ask ComplianceAlert "Flag {account_id} — score {risk.score}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` alert_result\n`}</span>
<span style={{color:C.kw}}>{`End If\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`If `}</span><span style={{color:C.val}}>{`{risk.level}`}</span><span style={{color:C.kw}}>{` equals `}</span><span style={{color:C.str}}>{`"low" `}</span><span style={{color:C.kw}}>{`then\n`}</span>
<span style={{color:C.str}}>{`  Step 3: Ask GroqLLM "Summarise low-risk profile for {account_id}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` summary\n`}</span>
<span style={{color:C.kw}}>{`End If\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Return</span><span style={{color:C.val}}>{` risk`}</span>
            </CodeBlock>
          </Section>

          {/* ── PARALLEL & ESCALATION ── */}
          <Section id="parallel" label="Parallel & escalation" color="#dc2626">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-6">
              Three parallel execution forms are supported. All are closed with <KW>End</KW>.
              Time units for timeouts: <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">s</code> seconds,
              <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border"> m</code> minutes,
              <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border"> h</code> hours,
              <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border"> d</code> days.
            </p>

            <div className="flex flex-col gap-5 mb-6">

              {/* Basic parallel */}
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-3">1 — Basic parallel (no timeout)</p>
                <CodeBlock filename="parallel-basic.ol">
<span style={{color:C.kw}}>{`Run in parallel\n`}</span>
<span style={{color:C.str}}>{`  Step 1: Ask GroqLLM "Analyse {text}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` analysis\n`}</span>
{`\n`}
<span style={{color:C.str}}>{`  Step 2: Ask Extractor "{text}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` entities\n`}</span>
<span style={{color:C.kw}}>{`End`}</span>
                </CodeBlock>
              </div>

              {/* Timed parallel */}
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-3">2 — Timed parallel (with timeout)</p>
                <CodeBlock filename="parallel-timed.ol">
<span style={{color:C.cm}}>{`# All steps must complete within 30 seconds or timed_out = true in context\n`}</span>
<span style={{color:C.kw}}>{`Run in parallel for `}</span><span style={{color:C.num}}>30</span><span style={{color:C.kw}}>{`s\n`}</span>
<span style={{color:C.str}}>{`  Step 1: Ask GroqLLM "Analyse {text}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` analysis\n`}</span>
{`\n`}
<span style={{color:C.str}}>{`  Step 2: Ask Extractor "{text}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` entities\n`}</span>
<span style={{color:C.kw}}>{`End`}</span>
                </CodeBlock>
                <p className="text-[13px] text-ink-4 mt-2">After a timed parallel block, <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">{"{"} timed_out {"}"}</code> is set in context: <code className="font-mono text-[12px]">true</code> if the deadline was exceeded.</p>
              </div>

              {/* Escalation */}
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-3">3 — Escalation (sequential levels with timeouts)</p>
                <CodeBlock filename="escalation.ol">
<span style={{color:C.cm}}>{`# Levels execute sequentially. First level to complete stops escalation.\n`}</span>
<span style={{color:C.kw}}>{`Run in parallel with escalation:\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`  Level 1: `}</span><span style={{color:C.str}}>{`immediately\n`}</span>
<span style={{color:C.str}}>{`    Step 1: Ask AutoResponder "Handle {incident_id}"\n`}</span>
<span style={{color:C.kw}}>{`    Save as`}</span><span style={{color:C.val}}>{` response\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`  Level 2: `}</span><span style={{color:C.str}}>{`within 5m\n`}</span>
<span style={{color:C.str}}>{`    Step 2: Ask OnCallEngineer "Escalation for {incident_id}"\n`}</span>
<span style={{color:C.kw}}>{`    Save as`}</span><span style={{color:C.val}}>{` response\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`  Level 3: `}</span><span style={{color:C.str}}>{`within 30m\n`}</span>
<span style={{color:C.str}}>{`    Step 3: Ask IncidentCommander "Critical: {incident_id}"\n`}</span>
<span style={{color:C.kw}}>{`    Save as`}</span><span style={{color:C.val}}>{` response\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`End\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Return</span><span style={{color:C.val}}>{` response`}</span>
                </CodeBlock>
                <p className="text-[13px] text-ink-4 mt-2">After escalation, context contains <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">escalation_completed</code>, <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">escalation_level</code>, and <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">timed_out</code>.</p>
              </div>
            </div>
          </Section>

          {/* ── ADVANCED STATEMENTS ── */}
          <Section id="advanced" label="Advanced statements" color="#7c3aed">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-6">
              These statements cover side effects, persistence, agent communication, and event emission.
              All are parsed and executed by the kernel.
            </p>

            <div className="flex flex-col gap-6">

              {/* Debrief */}
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-2">Debrief — send a message to an agent</p>
                <p className="text-[13px] text-ink-4 mb-3">Emits a <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">debrief</code> event. Variable references in the message are validated before emission.</p>
                <CodeBlock filename="debrief.ol">
<span style={{color:C.kw}}>Debrief</span><span style={{color:C.res}}>{` System `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.str}}>{` "High risk detected for {account_id} — score: {risk.score}"`}</span>
                </CodeBlock>
              </div>

              {/* Evolve */}
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-2">Evolve — request resolver improvement</p>
                <p className="text-[13px] text-ink-4 mb-3">Records an evolution request with feedback. When <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">OLANG_EVOLUTION_API_KEY</code> is set, advanced evolution is enabled.</p>
                <CodeBlock filename="evolve.ol">
<span style={{color:C.kw}}>Evolve</span><span style={{color:C.res}}>{` Extractor `}</span><span style={{color:C.kw}}>using feedback:</span><span style={{color:C.str}}>{` "Entity extraction missed subsidiary company names"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` evolution_result`}</span>
                </CodeBlock>
              </div>

              {/* Prompt */}
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-2">Prompt user — declare a user input step</p>
                <p className="text-[13px] text-ink-4 mb-3">Declares that user input is needed at this point. The kernel logs it; actual input collection depends on the runtime environment.</p>
                <CodeBlock filename="prompt.ol">
<span style={{color:C.kw}}>Prompt user to</span><span style={{color:C.str}}>{` "Please confirm the account ID before proceeding"`}</span>
                </CodeBlock>
              </div>

              {/* Persist */}
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-2">Persist — write context variable to file</p>
                <p className="text-[13px] text-ink-4 mb-3">Writes a saved variable to a file path. JSON files are serialised automatically. The variable must exist in context or the step is skipped with a warning.</p>
                <CodeBlock filename="persist.ol">
<span style={{color:C.cm}}>{`# Writes aggregated_risk as formatted JSON\n`}</span>
<span style={{color:C.kw}}>Persist</span><span style={{color:C.val}}>{` aggregated_risk `}</span><span style={{color:C.kw}}>to</span><span style={{color:C.str}}>{` "./logs/aggregated_risk.json"`}</span>
                </CodeBlock>
              </div>

              {/* Emit */}
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-2">Emit — fire a named event</p>
                <p className="text-[13px] text-ink-4 mb-3">Emits a runtime event with an interpolated payload. All <code className="font-mono text-[12px] bg-surface-2 px-1 py-0.5 rounded border border-border">{"{variable}"}</code> references in the payload are validated before emission.</p>
                <CodeBlock filename="emit.ol">
<span style={{color:C.kw}}>Emit</span><span style={{color:C.str}}>{` "risk_flagged" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` {account_id}`}</span>
                </CodeBlock>
              </div>

            </div>
          </Section>

          {/* ── CONSTRAINTS ── */}
          <Section id="constraints" label="Constraints" color="#0891b2">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-5">
              Constraints can be declared at the workflow level or per-step.
              The parser recognises and stores them; enforcement varies by constraint type.
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-2">Workflow-level constraint</p>
                <CodeBlock filename="constraint-workflow.ol">
<span style={{color:C.kw}}>Workflow</span><span style={{color:C.str}}>{` "Agentic Loop" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` task\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# Prevents runaway agentic loops — enforced by the kernel at runtime\n`}</span>
<span style={{color:C.kw}}>{`Constraint: max_generations = `}</span><span style={{color:C.num}}>5</span>
                </CodeBlock>
              </div>
              <div>
                <p className="font-syne font-bold text-[14px] text-ink mb-2">Per-step constraints</p>
                <CodeBlock filename="constraint-step.ol">
<span style={{color:C.kw}}>Step 1</span><span style={{color:C.str}}>{`: Ask SlowLookup "{task}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` result\n`}</span>
<span style={{color:C.kw}}>{`Constraint: max_time_sec = `}</span><span style={{color:C.num}}>{`10\n`}</span>
<span style={{color:C.kw}}>{`Constraint: cost_limit = `}</span><span style={{color:C.num}}>0.05</span>
                </CodeBlock>
                <p className="text-[13px] text-ink-4 mt-2">Per-step constraints are parsed and stored. The kernel currently warns when they are present — enforcement is in active development.</p>
              </div>
            </div>
          </Section>

          {/* ── FULL EXAMPLES ── */}
          <Section id="examples" label="Full examples" color="#dc2626">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-7">
              Complete production-style workflows using verified syntax only.
            </p>

            <div className="mb-8">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue flex-shrink-0" />
                <h3 className="font-syne font-bold text-[15px] text-ink">Finance — AML screening with branching</h3>
              </div>
              <CodeBlock filename="aml-screening.ol">
<span style={{color:C.kw}}>Workflow</span><span style={{color:C.str}}>{` "AML Screening" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` account_id, query\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`Allow resolvers:\n`}</span>
<span style={{color:C.res}}>{`  BankAccountLookup\n`}</span>
<span style={{color:C.res}}>{`  RiskClassifier\n`}</span>
<span style={{color:C.res}}>{`  ComplianceAlert\n`}</span>
<span style={{color:C.res}}>{`  GroqLLM\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 1</span><span style={{color:C.str}}>{`: Ask BankAccountLookup "{account_id}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` account\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 2</span><span style={{color:C.str}}>{`: Ask RiskClassifier "{account.transactions}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` risk\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`If `}</span><span style={{color:C.val}}>{`{risk.score}`}</span><span style={{color:C.kw}}>{` greater than `}</span><span style={{color:C.num}}>80</span><span style={{color:C.kw}}>{` then\n`}</span>
<span style={{color:C.str}}>{`  Step 3: Ask ComplianceAlert "Flag {account_id} — risk score {risk.score}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` alert\n`}</span>
<span style={{color:C.kw}}>{`End If\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 4</span><span style={{color:C.str}}>{`: Ask GroqLLM "{query}. Risk: {risk.level}. Score: {risk.score}. Account: {account.id}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` analysis\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Persist</span><span style={{color:C.val}}>{` risk `}</span><span style={{color:C.kw}}>to</span><span style={{color:C.str}}>{` "./logs/aml_risk.json"\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Return</span><span style={{color:C.val}}>{` analysis, risk`}</span>
              </CodeBlock>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <h3 className="font-syne font-bold text-[15px] text-ink">Healthcare — parallel ICU assessment</h3>
              </div>
              <CodeBlock filename="icu-parallel.ol">
<span style={{color:C.kw}}>Workflow</span><span style={{color:C.str}}>{` "ICU Assessment" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` patient_id, question\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`Allow resolvers:\n`}</span>
<span style={{color:C.res}}>{`  ICUAdmission\n`}</span>
<span style={{color:C.res}}>{`  LabResults\n`}</span>
<span style={{color:C.res}}>{`  GroqLLM\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# Fetch admission record and lab results in parallel — 20s timeout\n`}</span>
<span style={{color:C.kw}}>{`Run in parallel for `}</span><span style={{color:C.num}}>20</span><span style={{color:C.kw}}>s</span>{`\n`}
<span style={{color:C.str}}>{`  Step 1: Ask ICUAdmission "{patient_id}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` admission\n`}</span>
{`\n`}
<span style={{color:C.str}}>{`  Step 2: Ask LabResults "{patient_id}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` labs\n`}</span>
<span style={{color:C.kw}}>{`End\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 3</span><span style={{color:C.str}}>{`: Ask GroqLLM "{question}. Ward: {admission.ward}. Hb: {labs.haemoglobin}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` summary\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Return</span><span style={{color:C.val}}>{` summary`}</span>
              </CodeBlock>
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
                <h3 className="font-syne font-bold text-[15px] text-ink">Multi-agent — risk assessment with debrief and persist</h3>
              </div>
              <CodeBlock filename="risk-assessment.ol">
<span style={{color:C.kw}}>Workflow</span><span style={{color:C.str}}>{` "Risk Assessment Demo" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` text, user_id\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`Allow resolvers:\n`}</span>
<span style={{color:C.res}}>{`  GroqLLM\n`}</span>
<span style={{color:C.res}}>{`  Extractor\n`}</span>
<span style={{color:C.res}}>{`  AggregateConfidence\n`}</span>
<span style={{color:C.res}}>{`  NotifySystem\n`}</span>
<span style={{color:C.res}}>{`  Persist\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 1</span><span style={{color:C.str}}>{`: Ask GroqLLM "Analyse the incident: {text}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` analysis\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 2</span><span style={{color:C.str}}>{`: Ask Extractor "{analysis}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` risks\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 3</span><span style={{color:C.str}}>{`: Ask AggregateConfidence "{risks}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` aggregated_risk\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`If `}</span><span style={{color:C.val}}>{`{aggregated_risk.score}`}</span><span style={{color:C.kw}}>{` greater than `}</span><span style={{color:C.num}}>80</span><span style={{color:C.kw}}>{` then\n`}</span>
<span style={{color:C.kw}}>{`  Debrief `}</span><span style={{color:C.res}}>System</span><span style={{color:C.kw}}>{` with `}</span><span style={{color:C.str}}>{`"High risk detected for user {user_id} — score {aggregated_risk.score}"\n`}</span>
<span style={{color:C.kw}}>{`End If\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Persist</span><span style={{color:C.val}}>{` aggregated_risk `}</span><span style={{color:C.kw}}>to</span><span style={{color:C.str}}>{` "./logs/aggregated_risk.json"\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Return</span><span style={{color:C.val}}>{` risks, aggregated_risk`}</span>
              </CodeBlock>
            </div>
          </Section>

          {/* ── CHEATSHEET ── */}
          <Section id="cheatsheet" label="Cheatsheet" color="#0891b2">
            <p className="text-[14.5px] text-ink-4 leading-relaxed mb-6">
              Every verified keyword in one annotated file.
            </p>
            <div className="rounded-[14px] bg-[#0d1117] border border-white/[0.08] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-white/[0.02]">
                <span className="font-mono text-[11.5px] text-white/40">o-lang-cheatsheet.ol</span>
                <span className="font-mono text-[10.5px] text-white/25">verified against kernel parser</span>
              </div>
              <div className="px-6 py-5 overflow-x-auto">
                <pre className="font-mono text-[12.5px] leading-[2.1]">
<span style={{color:C.cm}}>{`# ── DECLARATION ────────────────────────────────────────────────\n`}</span>
<span style={{color:C.kw}}>Workflow</span><span style={{color:C.str}}>{` "Name" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` input_one, input_two\n`}</span>
<span style={{color:C.kw}}>{`Constraint: max_generations = `}</span><span style={{color:C.num}}>5</span><span style={{color:C.cm}}>{`          # optional workflow constraint\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# ── RESOLVER ALLOWLIST ─────────────────────────────────────────\n`}</span>
<span style={{color:C.kw}}>{`Allow resolvers:\n`}</span>
<span style={{color:C.res}}>{`  ToolA\n`}</span>
<span style={{color:C.res}}>{`  ToolB\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# ── STEPS ──────────────────────────────────────────────────────\n`}</span>
<span style={{color:C.kw}}>Step 1</span><span style={{color:C.str}}>{`: Ask ToolA "{input_one}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` result_a\n`}</span>
<span style={{color:C.kw}}>{`Constraint: max_time_sec = `}</span><span style={{color:C.num}}>10</span><span style={{color:C.cm}}>{`                # optional per-step constraint\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 2</span><span style={{color:C.str}}>{`: Ask ToolB "{input_two}. Field: {result_a.field}"\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` result_b\n`}</span>
{`\n`}
<span style={{color:C.kw}}>Step 3</span><span style={{color:C.str}}>{`: `}</span><span style={{color:C.kw}}>Use</span><span style={{color:C.res}}>{` ToolA\n`}</span>
<span style={{color:C.kw}}>Save as</span><span style={{color:C.val}}>{` tool_result\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# ── CONTROL FLOW ───────────────────────────────────────────────\n`}</span>
<span style={{color:C.kw}}>{`If `}</span><span style={{color:C.val}}>{`{result_a.score}`}</span><span style={{color:C.kw}}>{` greater than `}</span><span style={{color:C.num}}>80</span><span style={{color:C.kw}}>{` then\n`}</span>
<span style={{color:C.str}}>{`  Step 4: Ask ToolA "{result_a.id} flagged"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` flag_result\n`}</span>
<span style={{color:C.kw}}>{`End If\n`}</span>
{`\n`}
<span style={{color:C.kw}}>{`If `}</span><span style={{color:C.val}}>{`{result_a.status}`}</span><span style={{color:C.kw}}>{` equals `}</span><span style={{color:C.str}}>{`"low" `}</span><span style={{color:C.kw}}>{`then\n`}</span>
<span style={{color:C.str}}>{`  Step 5: Ask ToolB "Summarise {result_b}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` summary\n`}</span>
<span style={{color:C.kw}}>{`End If\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# ── PARALLEL ────────────────────────────────────────────────────\n`}</span>
<span style={{color:C.kw}}>{`Run in parallel for `}</span><span style={{color:C.num}}>30</span><span style={{color:C.kw}}>{`s\n`}</span>
<span style={{color:C.str}}>{`  Step 6: Ask ToolA "{input_one}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` p_result_a\n`}</span>
<span style={{color:C.str}}>{`  Step 7: Ask ToolB "{input_two}"\n`}</span>
<span style={{color:C.kw}}>{`  Save as`}</span><span style={{color:C.val}}>{` p_result_b\n`}</span>
<span style={{color:C.kw}}>{`End\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# ── ADVANCED STATEMENTS ────────────────────────────────────────\n`}</span>
<span style={{color:C.kw}}>Debrief</span><span style={{color:C.res}}>{` System `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.str}}>{` "Completed for {input_one}"\n`}</span>
<span style={{color:C.kw}}>Evolve</span><span style={{color:C.res}}>{` ToolA `}</span><span style={{color:C.kw}}>using feedback:</span><span style={{color:C.str}}>{` "Improve accuracy on edge cases"\n`}</span>
<span style={{color:C.kw}}>Prompt user to</span><span style={{color:C.str}}>{` "Confirm before proceeding"\n`}</span>
<span style={{color:C.kw}}>Persist</span><span style={{color:C.val}}>{` result_b `}</span><span style={{color:C.kw}}>to</span><span style={{color:C.str}}>{` "./logs/output.json"\n`}</span>
<span style={{color:C.kw}}>Emit</span><span style={{color:C.str}}>{` "workflow_done" `}</span><span style={{color:C.kw}}>with</span><span style={{color:C.val}}>{` {result_b}\n`}</span>
{`\n`}
<span style={{color:C.cm}}>{`# ── RETURN ──────────────────────────────────────────────────────\n`}</span>
<span style={{color:C.kw}}>Return</span><span style={{color:C.val}}>{` result_a, result_b       `}</span><span style={{color:C.cm}}>{`# comma-separated, always last line\n`}</span>
                </pre>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/playground" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue text-white text-[14px] font-semibold rounded-[10px] hover:opacity-90 transition-opacity">
                <svg viewBox="0 0 16 16" fill="white" className="w-3.5 h-3.5"><path d="M4 2l9 6-9 6V2z"/></svg>
                Try it in the Playground
              </Link>
              <Link href="/docs" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-border text-ink text-[14px] font-semibold rounded-[10px] hover:border-border-2 transition-colors">
                Full docs →
              </Link>
              <Link href="/registry" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-border text-ink text-[14px] font-semibold rounded-[10px] hover:border-border-2 transition-colors">
                Browse tools →
              </Link>
            </div>
          </Section>

        </main>
      </div>
    </div>
  );
}