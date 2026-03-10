import Link from "next/link";

// ── SIDEBAR LINKS ──────────────────────────────────────────────────────────
const SIDEBAR = [
  { id: "quickstart",  label: "Quickstart",         icon: "⚡" },
  { id: "tools",       label: "Building Tools",      icon: "🔧" },
  { id: "governance",  label: "Governance",          icon: "🛡️" },
  { id: "kernel",      label: "Kernel Architecture", icon: "⚙️" },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">

      {/* Top bar */}
      <div className="border-b border-border bg-white sticky top-0 z-30">
        <div className="max-w-[1160px] mx-auto px-[5%] h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-syne font-extrabold text-[17px] text-ink tracking-[-0.5px]">O-Lang</Link>
            <span className="text-border mx-1">/</span>
            <span className="text-[14px] text-ink-4 font-medium">Documentation</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="https://o-lang-central.github.io/spec/v1.1.html" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-[7px] hover:bg-amber-100 transition-colors">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-3.5 h-3.5">
                <path d="M2 12.5A1.5 1.5 0 013.5 11H14"/><path d="M3.5 1H14v14H3.5A1.5 1.5 0 012 13.5v-11A1.5 1.5 0 013.5 1z"/>
              </svg>
              v1.1 Kernel Spec ↗
            </a>
            <Link href="/playground" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue rounded-[7px] hover:opacity-90 transition-opacity">
              Open Playground →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1160px] mx-auto px-[5%] flex gap-10 py-12">

        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24">
            <p className="font-mono text-[10.5px] uppercase tracking-[1.5px] text-ink-5 mb-3">On this page</p>
            <nav className="flex flex-col gap-1">
              {SIDEBAR.map((s) => (
                <a key={s.id} href={`#${s.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] text-ink-4 font-medium hover:bg-surface-2 hover:text-ink transition-colors">
                  <span className="text-[13px]">{s.icon}</span>
                  {s.label}
                </a>
              ))}
            </nav>
            <div className="mt-8 pt-6 border-t border-border">
              <p className="font-mono text-[10.5px] uppercase tracking-[1.5px] text-ink-5 mb-3">Resources</p>
              <a href="https://github.com/O-Lang-Central" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-ink-4 hover:text-ink transition-colors mb-2">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                GitHub
              </a>
              <a href="/registry" className="flex items-center gap-2 text-[13px] text-ink-4 hover:text-ink transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
                Tool Registry
              </a>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 max-w-[740px]">

          {/* Hero */}
          <div className="mb-14">
            <span className="inline-block font-mono text-[11px] tracking-[1.5px] uppercase text-blue mb-3">Documentation</span>
            <h1 className="font-syne text-[40px] font-extrabold tracking-[-1.5px] leading-[1.1] text-ink mb-4">
              Build governed AI<br />with O-Lang
            </h1>
            <p className="text-[17px] text-ink-4 leading-relaxed max-w-[520px]">
              O-Lang is a workflow language for AI systems that require auditability, safety enforcement, and cryptographic accountability. Built for Finance, Healthcare, Government, and IoT — every execution is governed, not hoped for.
            </p>
          </div>

          {/* ── QUICKSTART ────────────────────────────────────────────── */}
          <section id="quickstart" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-[9px] bg-blue-light flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#1a56db" strokeWidth="2" className="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <h2 className="font-syne text-[24px] font-bold text-ink tracking-[-0.5px]">Quickstart</h2>
            </div>
            <p className="text-[15px] text-ink-4 leading-relaxed mb-8">
              Get O-Lang running and execute your first governed workflow in under 5 minutes.
            </p>

            {/* Step 1 */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-blue text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">1</span>
                <h3 className="font-syne font-bold text-[15px] text-ink">Install the kernel and tools</h3>
              </div>
              <p className="text-[14px] text-ink-4 mb-3 ml-7">
                The JS kernel is the runtime — stable, production-ready, and language-agnostic. Tools are separate npm (or pip) packages you install and declare in your workflow.
              </p>
              <div className="rounded-[12px] bg-[#0f172a] border border-white/[0.08] p-5 overflow-x-auto ml-7">
                <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest mb-3">Terminal</p>
                <pre className="font-mono text-[13.5px] text-[#93c5fd] leading-[1.9]">{`npm install @o-lang/olang
npm install @o-lang/llm-groq
npm install @o-lang/bank-account-lookup`}</pre>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-blue text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">2</span>
                <h3 className="font-syne font-bold text-[15px] text-ink">Write your first workflow</h3>
              </div>
              <p className="text-[14px] text-ink-4 mb-3 ml-7">
                Create <code className="font-mono text-[13px] bg-surface-2 px-1.5 py-0.5 rounded text-blue border border-border">my-workflow.ol</code>. The <code className="font-mono text-[13px] bg-surface-2 px-1.5 py-0.5 rounded text-blue border border-border">Allow resolvers:</code> block is your governance contract — only listed tools can execute.
              </p>
              <div className="rounded-[12px] bg-[#0f172a] border border-white/[0.08] p-5 overflow-x-auto ml-7">
                <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest mb-3">my-workflow.ol</p>
                <pre className="font-mono text-[13.5px] leading-[1.9]">
                  <span className="text-[#818cf8]">Workflow</span><span className="text-white"> {`"Balance Check"`} </span><span className="text-[#818cf8]">with</span><span className="text-[#fbbf24]">{" customer_id, user_question\n"}</span>
                  {"\n"}
                  <span className="text-[#818cf8]">{"Allow resolvers:\n"}</span>
                  <span className="text-[#34d399]">{"  - @o-lang/bank-account-lookup\n"}</span>
                  <span className="text-[#34d399]">{"  - @o-lang/llm-groq\n"}</span>
                  {"\n"}
                  <span className="text-[#818cf8]">Step 1</span><span className="text-white">{": Ask "}</span><span className="text-[#34d399]">@o-lang/bank-account-lookup</span><span className="text-[#fbbf24]">{` "{customer_id}"\n`}</span>
                  <span className="text-white">{"Save as "}</span><span className="text-[#fbbf24]">{"account_info\n"}</span>
                  {"\n"}
                  <span className="text-[#818cf8]">Step 2</span><span className="text-white">{": Ask "}</span><span className="text-[#34d399]">@o-lang/llm-groq</span><span className="text-[#fbbf24]">{` "{user_question}. Balance: {account_info.balance}"\n`}</span>
                  <span className="text-white">{"Save as "}</span><span className="text-[#fbbf24]">{"response\n"}</span>
                  {"\n"}
                  <span className="text-[#818cf8]">Return</span><span className="text-[#fbbf24]">{" response"}</span>
                </pre>
              </div>
            </div>

            {/* Step 3 */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-blue text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">3</span>
                <h3 className="font-syne font-bold text-[15px] text-ink">Run it</h3>
              </div>
              <p className="text-[14px] text-ink-4 mb-3 ml-7">
                Pass inputs and receive a governed response with a full cryptographic audit trail.
              </p>
              <div className="rounded-[12px] bg-[#0f172a] border border-white/[0.08] p-5 overflow-x-auto ml-7">
                <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest mb-3">run.js</p>
                <pre className="font-mono text-[13.5px] text-[#93c5fd] leading-[1.9]">{`const { runWorkflow } = require('@o-lang/olang');

const result = await runWorkflow('my-workflow.ol', {
  customer_id:   'CUST-001',
  user_question: 'What is my current balance?'
});

console.log(result.response);
// → "Your current balance is $12,450.00."

console.log(result.audit.execution_hash);
// → sha3:a3f8c2d1...  (cryptographic proof of execution)`}</pre>
              </div>
            </div>

            {/* Step 4 */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-blue text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">4</span>
                <h3 className="font-syne font-bold text-[15px] text-ink">What you get</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-7">
                {[
                  { title: "Governed response",   desc: "Output produced only through declared tools in the declared order." },
                  { title: "Execution trace",      desc: "Every step logged with resolver name, policy check, and timestamp." },
                  { title: "Audit hash chain",     desc: "SHA3-256 fingerprint chained from genesis block to final output." },
                  { title: "Safety enforcement",   desc: "Prohibited intents blocked before any tool is called." },
                ].map((item) => (
                  <div key={item.title} className="rounded-[10px] p-4 border border-green-200 bg-green-50 flex items-start gap-3">
                    <span className="font-bold mt-0.5 flex-shrink-0 text-green-600">✓</span>
                    <div>
                      <p className="font-semibold text-[13px] text-ink">{item.title}</p>
                      <p className="text-[12.5px] text-ink-4 mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 ml-7">
              <Link href="/playground" className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-blue rounded-[8px] hover:opacity-90 transition-opacity">
                Try in Playground →
              </Link>
              <Link href="/lab" className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-ink bg-surface-2 border border-border rounded-[8px] hover:bg-surface transition-colors">
                Open Lab Sandbox →
              </Link>
            </div>
          </section>

          <hr className="border-border mb-16" />

          {/* ── BUILDING TOOLS ──────────────────────────────────────────── */}
          <section id="tools" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-[9px] bg-green-light flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-4 h-4"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>
              </div>
              <h2 className="font-syne text-[24px] font-bold text-ink tracking-[-0.5px]">Building Tools</h2>
            </div>
            <p className="text-[15px] text-ink-4 leading-relaxed mb-8">
              In O-Lang, tools are called <strong className="text-ink font-semibold">resolvers</strong> internally — modular, schema-validated functions the kernel calls during workflow execution. Resolvers can be written in <strong className="text-ink font-semibold">any language</strong> (Node.js, Python, Go, Rust, and more). The only requirement: JSON in, JSON out, and a passing conformance test suite. Both npm and PyPI resolvers are first-class citizens in the registry.
            </p>

            <div className="mb-8">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-3">Anatomy of a resolver</h3>
              <p className="text-[14px] text-ink-4 mb-4 leading-relaxed">
                Every resolver exports a <code className="font-mono text-[13px] bg-surface-2 px-1.5 py-0.5 rounded text-blue border border-border">declaration</code> (what it is and what it can do) and a <code className="font-mono text-[13px] bg-surface-2 px-1.5 py-0.5 rounded text-blue border border-border">resolve</code> function (the actual logic).
              </p>
              <div className="rounded-[12px] bg-[#0f172a] border border-white/[0.08] p-5 mb-4 overflow-x-auto">
                <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest mb-3">index.js — minimal resolver</p>
                <pre className="font-mono text-[13.5px] text-[#93c5fd] leading-[1.9]">{`const declaration = {
  name:    "@my-org/my-tool",
  version: "1.0.0",
  input: {
    type: "object",
    properties: {
      id: { type: "string", description: "Record ID to look up" }
    },
    required: ["id"]
  },
  output: {
    type: "object",
    properties: {
      result: { type: "string" },
      found:  { type: "boolean" }
    }
  },
  properties: {
    deterministic: true,    // same input → same output
    sideEffects:   false,   // read-only
    requiresAuth:  false
  }
};

async function resolve(input) {
  const record = await db.find(input.id);
  return { result: record.value, found: !!record };
}

module.exports = { declaration, resolve };`}</pre>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-3">Declaration fields</h3>
              <div className="border border-border rounded-[12px] overflow-hidden">
                <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="bg-surface-2 border-b border-border">
                      <th className="text-left px-4 py-2.5 font-semibold text-ink">Field</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-ink">Type</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-ink">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["name",          "string",       "Scoped npm package name, e.g. @org/tool"],
                      ["version",       "string",       "Semver version string"],
                      ["input",         "JSON Schema",  "Validates inputs before resolve() is called"],
                      ["output",        "JSON Schema",  "Validates outputs before entering the step context"],
                      ["deterministic", "boolean",      "Whether the same input always produces the same output"],
                      ["sideEffects",   "boolean",      "Whether the resolver writes to external state"],
                    ].map(([field, type, purpose], i) => (
                      <tr key={field} className={i > 0 ? "border-t border-border" : ""}>
                        <td className="px-4 py-2.5 font-mono text-blue">{field}</td>
                        <td className="px-4 py-2.5 text-ink-4 font-mono text-[12px]">{type}</td>
                        <td className="px-4 py-2.5 text-ink-4">{purpose}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-3">Testing your resolver</h3>
              <div className="rounded-[12px] bg-[#0f172a] border border-white/[0.08] p-5 overflow-x-auto">
                <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest mb-3">test.js</p>
                <pre className="font-mono text-[13.5px] text-[#93c5fd] leading-[1.9]">{`const myTool = require('./index');

// Verify declaration shape
console.assert(myTool.declaration.name, 'name required');
console.assert(typeof myTool.resolve === 'function', 'resolve must be a function');

// Test the resolver
const result = await myTool.resolve({ id: 'test-001' });
console.log(result);
// → { result: "...", found: true }`}</pre>
              </div>
            </div>

            {/* Conformance test suite */}
            <div className="mb-8">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-3">Conformance test suite (R-005 → R-012)</h3>
              <p className="text-[14px] text-ink-4 mb-4 leading-relaxed">
                Every O-Lang resolver — in any language — must pass 8 conformance tests before it can be used in production or listed in the registry.
                The tests are JSON-defined and language-neutral: the runner adapts, the contract does not.
              </p>
              <div className="border border-border rounded-[12px] overflow-hidden mb-4">
                <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr className="bg-surface-2 border-b border-border">
                      <th className="text-left px-4 py-2.5 font-semibold text-ink w-[100px]">Test</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-ink">Enforces</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-ink hidden md:table-cell">Why it matters</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["R-005", "Resolver metadata contract",    "resolverName and version must exist — anonymous tools cannot be trusted"],
                      ["R-006", "Resolver runtime shape",        "resolve(input) accepts one arg and returns {output} or {error}, never both"],
                      ["R-007", "Failure contract",              "Invalid input returns {error: string} — never throws an uncaught exception"],
                      ["R-008", "Input validation",              "Valid input is accepted; malformed actions are explicitly rejected"],
                      ["R-009", "Retry semantics",               "If retriable is present, it must be a boolean — automation engines depend on this"],
                      ["R-010", "Output contract",               "Valid input produces {output}; output must be JSON-serializable"],
                      ["R-011", "Determinism",                   "Same input → same output — enables replay, caching, and audit"],
                      ["R-012", "Side-effect safety",            "No observable side effects during validation — resolvers behave like pure functions"],
                    ].map(([id, enforces, why], i) => (
                      <tr key={id} className={i > 0 ? "border-t border-border" : ""}>
                        <td className="px-4 py-2.5 font-mono text-blue font-medium">{id}</td>
                        <td className="px-4 py-2.5 text-ink font-medium">{enforces}</td>
                        <td className="px-4 py-2.5 text-ink-4 hidden md:table-cell">{why}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[13px] text-ink-5 leading-relaxed">
                Run <code className="font-mono text-[12px] bg-surface-2 px-1.5 py-0.5 rounded border border-border">olang-test --json</code> (Python) or <code className="font-mono text-[12px] bg-surface-2 px-1.5 py-0.5 rounded border border-border">npx olang-test --json</code> (Node.js).
                A passing run generates <code className="font-mono text-[12px] bg-surface-2 px-1.5 py-0.5 rounded border border-border">badge.txt</code> — the O-Lang CERTIFIED confirmation required before registry submission.
              </p>
            </div>

            <div className="bg-blue-light border border-blue/20 rounded-[12px] px-5 py-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                <p className="font-syne font-bold text-[15px] text-blue">Publishing to the Tool Registry</p>
                <span className="font-mono text-[11px] text-blue bg-white border border-blue/20 px-2.5 py-1 rounded-full">Two gates. No exceptions.</span>
              </div>
              <p className="text-[13px] text-ink-4 mb-5 leading-relaxed">
                Every resolver — Node.js or Python — must pass the same 8 conformance tests (R-005 → R-012)
                before it can be submitted. When you submit, the O-Lang team independently re-runs the full suite on their end.
                A tool is only listed if it passes both times.
              </p>
              {/* Conformance tests grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5 text-[12px]">
                {[
                  ["R-005", "Metadata contract",    "resolverName + version must exist and be traceable"],
                  ["R-006", "Runtime shape",         "resolve(input) → {output} or {error} — never both"],
                  ["R-007", "Failure contract",      "Invalid input returns {error}, never throws uncaught"],
                  ["R-008", "Input validation",      "Malformed actions explicitly rejected at boundary"],
                  ["R-009", "Retry semantics",       "retriable must be boolean if present"],
                  ["R-010", "Output contract",       "Output must always be JSON-serializable"],
                  ["R-011", "Determinism",           "Same input → same output, no hidden state"],
                  ["R-012", "Side-effect safety",    "No observable side effects during validation"],
                ].map(([id, label, desc]) => (
                  <div key={id} className="flex items-start gap-2 bg-white/70 border border-blue/15 rounded-[8px] px-3 py-2.5">
                    <code className="font-mono text-[11px] text-blue font-bold flex-shrink-0 mt-0.5 w-12">{id}</code>
                    <div>
                      <p className="font-semibold text-ink text-[12px] leading-snug">{label}</p>
                      <p className="text-ink-5 text-[11.5px] leading-snug mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <ol className="text-[14px] text-ink-4 leading-relaxed space-y-3 list-none mb-5">
                <li className="flex gap-2.5">
                  <span className="text-blue font-bold flex-shrink-0 w-5">1.</span>
                  <span>Run the conformance suite locally — all 8 tests must pass:<br />
                    <code className="font-mono text-[12px] bg-white px-2 py-0.5 rounded text-blue border border-blue/20 mt-1.5 inline-block">pip install olang-resolver-test &amp;&amp; olang-test --json</code>
                    <span className="mx-2 text-ink-5 text-[12px]">or</span>
                    <code className="font-mono text-[12px] bg-white px-2 py-0.5 rounded text-blue border border-blue/20">npx olang-test --json</code>
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-blue font-bold flex-shrink-0 w-5">2.</span>
                  <span>A <strong className="text-ink font-semibold">certification badge</strong> is generated (<code className="font-mono text-[12px] bg-white px-1.5 py-0.5 rounded text-blue border border-blue/20">badge.txt</code>) — include it in your repo README to confirm O-Lang CERTIFIED status.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-blue font-bold flex-shrink-0 w-5">3.</span>
                  <span>Publish to <strong className="text-ink font-semibold">npm</strong> or <strong className="text-ink font-semibold">PyPI</strong>, then <a href="/registry" className="text-blue underline underline-offset-2">submit via the Tool Registry</a>.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-blue font-bold flex-shrink-0 w-5">4.</span>
                  <span>The O-Lang team <strong className="text-ink font-semibold">independently re-runs the full conformance suite</strong> and reviews governance compatibility before approving listing.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="text-blue font-bold flex-shrink-0 w-5">5.</span>
                  <span>Once approved, your tool receives a <strong className="text-ink font-semibold">verified badge</strong> and appears in the registry — searchable by language, domain, and tag.</span>
                </li>
              </ol>
              {/* Conformance test result preview */}
              <div className="rounded-[10px] bg-[#0f172a] border border-white/[0.06] px-4 py-3 font-mono text-[12px] leading-[1.8]">
                <p className="text-white/30 text-[10.5px] uppercase tracking-widest mb-2">conformance suite output</p>
                <p className="text-[#93c5fd]"><span className="text-green">✅</span> R-005 resolver-metadata-contract</p>
                <p className="text-[#93c5fd]"><span className="text-green">✅</span> R-006 resolver-runtime-shape</p>
                <p className="text-[#93c5fd]"><span className="text-green">✅</span> R-007 resolver-failure-contract</p>
                <p className="text-[#93c5fd]"><span className="text-green">✅</span> R-008 resolver-input-validation</p>
                <p className="text-[#93c5fd]"><span className="text-green">✅</span> R-009 resolver-retry-semantics</p>
                <p className="text-[#93c5fd]"><span className="text-green">✅</span> R-010 resolver-output-contract</p>
                <p className="text-[#93c5fd]"><span className="text-green">✅</span> R-011 resolver-determinism</p>
                <p className="text-[#93c5fd]"><span className="text-green">✅</span> R-012 resolver-side-effects</p>
                <p className="text-white/50 mt-2">🎉 Resolver is O-Lang CERTIFIED</p>
                <p className="text-white/50">🏷️  Badge generated: badge.txt</p>
              </div>
            </div>

            {/* Python resolvers */}
            <div className="mt-8 rounded-[14px] border border-border bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-border bg-surface-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" strokeWidth="0">
                    <path fill="#3b82f6" d="M11.5 2C8.46 2 7 3.19 7 4.5V6h5v.5H5.5C4.12.5 3 1.67 3 3.11v4.78C3 9.33 4.12 10.5 5.5 10.5H7v-2c0-1.38 1.12-2.5 2.5-2.5H14c1.38 0 2.5-1.12 2.5-2.5V4.5C16.5 3.12 15.5 2 14 2h-2.5z"/>
                    <path fill="#facc15" d="M12.5 22c3.04 0 4.5-1.19 4.5-2.5V18h-5v-.5h6.5c1.38 0 2.5-1.17 2.5-2.61v-4.78C21 8.67 19.88 7.5 18.5 7.5H17v2c0 1.38-1.12 2.5-2.5 2.5H10c-1.38 0-2.5 1.12-2.5 2.5v3c0 1.38 1 2.5 2.5 2.5h2.5z"/>
                  </svg>
                  <span className="font-syne font-bold text-[15px] text-ink">Python Resolvers</span>
                </div>
                <span className="font-mono text-[11px] text-green bg-green/10 border border-green/20 px-2 py-0.5 rounded">
                  live on PyPI
                </span>
              </div>
              <div className="px-5 py-5">
                <p className="text-[14px] text-ink-4 leading-relaxed mb-5">
                  Python resolvers follow the same declaration + resolve contract as Node.js resolvers. Since the JS kernel is language-agnostic, Python resolvers integrate today via a lightweight HTTP bridge — no Python kernel required.
                  Two reference packages are already published on PyPI and have passed the full conformance suite (R-005 → R-012):
                </p>

                {/* Package cards */}
                <div className="flex flex-col gap-3 mb-5">
                  {[
                    {
                      pkg: "olang-resolver-test",
                      pip: "pip install olang-resolver-test",
                      badge: "scaffold",
                      desc: "Reference implementation and starter scaffold. Use this as the template when building any new Python resolver.",
                    },
                    {
                      pkg: "olang-semantic-doc-search",
                      pip: "pip install olang-semantic-doc-search",
                      badge: "utils",
                      desc: "Embedding-powered semantic document search with governed output scope and result format enforcement.",
                    },
                  ].map(({ pkg, pip, badge, desc }) => (
                    <div key={pkg} className="rounded-[10px] border border-border bg-surface-2 p-4">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <code className="font-mono text-[13px] text-blue font-medium">{pkg}</code>
                        <span className="font-mono text-[10.5px] text-ink-5 bg-white border border-border px-1.5 py-0.5 rounded">{badge}</span>
                      </div>
                      <p className="text-[13px] text-ink-4 mb-3 leading-relaxed">{desc}</p>
                      <div className="bg-[#0f172a] rounded-[8px] px-3 py-2 font-mono text-[12.5px] text-[#93c5fd] flex items-center justify-between gap-2">
                        <span>{pip}</span>
                        <a
                          href={"https://pypi.org/project/" + pkg}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/30 hover:text-white/60 transition-colors text-[11px] flex-shrink-0"
                        >
                          PyPI ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-[10px] bg-blue-light border border-blue/20 px-4 py-3.5">
                  <p className="font-semibold text-[13px] text-blue mb-1">Python resolver anatomy</p>
                  <p className="text-[13px] text-ink-4 leading-relaxed">
                    A Python resolver exposes a <code className="font-mono text-[12px] bg-white px-1.5 py-0.5 rounded text-blue border border-blue/20">declaration</code> dict and a <code className="font-mono text-[12px] bg-white px-1.5 py-0.5 rounded text-blue border border-blue/20">resolve(input)</code> function served over HTTP. The JS kernel calls it via the standard resolver protocol — the language is invisible to the workflow author. When the native Python kernel ships, the same resolver code works without any changes.
                    See <a href="https://pypi.org/project/olang-resolver-test" target="_blank" rel="noopener noreferrer" className="text-blue underline underline-offset-2">olang-resolver-test</a> for the full scaffold with examples.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <hr className="border-border mb-16" />

          {/* ── GOVERNANCE ──────────────────────────────────────────────── */}
          <section id="governance" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-[9px] bg-purple-light flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h2 className="font-syne text-[24px] font-bold text-ink tracking-[-0.5px]">Governance</h2>
            </div>
            <p className="text-[15px] text-ink-4 leading-relaxed mb-8">
              Governance in O-Lang is declarative — rules live in the workflow file itself. The kernel reads them at load time and enforces them at every execution step, with no way to bypass them at runtime.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { title: "Tool Allowlists",  color: "#1a56db", bg: "#eff6ff", border: "#bfdbfe",
                  desc: "Only tools declared in Allow resolvers: can be called. Any unlisted tool is rejected before the step executes." },
                { title: "Verified Intent",  color: "#059669", bg: "#f0fdf4", border: "#bbf7d0",
                  desc: "Declare scope and prohibited actions. The kernel validates intent before and after execution." },
                { title: "Safety Policy",    color: "#dc2626", bg: "#fef2f2", border: "#fecaca",
                  desc: "Built-in filters block PII leakage, hallucinations, speculative outputs, and prompt injection." },
              ].map((g) => (
                <div key={g.title} className="rounded-[10px] p-4 border" style={{ background: g.bg, borderColor: g.border }}>
                  <p className="font-syne text-[14px] font-bold mb-1.5" style={{ color: g.color }}>{g.title}</p>
                  <p className="text-[13px] text-ink-4 leading-relaxed">{g.desc}</p>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-3">Tool allowlists</h3>
              <p className="text-[14px] text-ink-4 mb-4 leading-relaxed">
                The most fundamental governance primitive. If a tool is not listed, any step that tries to call it is rejected — even if injected via prompt manipulation.
              </p>
              <div className="rounded-[12px] bg-[#0f172a] border border-white/[0.08] p-5 overflow-x-auto">
                <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest mb-3">Allowlist declaration</p>
                <pre className="font-mono text-[13.5px] text-[#93c5fd] leading-[1.9]">{`Allow resolvers:
  - @o-lang/bank-account-lookup   # approved: read-only DB access
  - @o-lang/llm-groq              # approved: LLM inference

# These would be REJECTED at runtime — even if a step tried to call them:
# - @o-lang/send-email
# - @o-lang/modify-balance
# - any tool not in this list`}</pre>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-3">Intent scope and prohibited actions</h3>
              <p className="text-[14px] text-ink-4 mb-4 leading-relaxed">
                Declare the semantic scope and the actions the workflow must never perform. The kernel catches violations in the user query <em>before</em> any tool is called.
              </p>
              <div className="rounded-[12px] bg-[#0f172a] border border-white/[0.08] p-5 mb-4 overflow-x-auto">
                <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest mb-3">Intent declarations</p>
                <pre className="font-mono text-[13.5px] text-[#93c5fd] leading-[1.9]">{`Prohibit actions:
  - transfer_funds
  - modify_balance
  - speculative_balance

Intent scope: "balance_inquiry_only"`}</pre>
              </div>
              <div className="rounded-[12px] bg-red-50 border border-red-200 p-4">
                <p className="font-semibold text-[13px] text-red-700 mb-1">What happens on a violation</p>
                <p className="text-[13px] text-red-600 leading-relaxed">
                  If a user query matches a prohibited action (e.g. <em>"transfer $500 to James"</em>), the kernel raises a <code className="font-mono text-[12px] bg-red-100 px-1 rounded">safety_halt</code> before Step 1 runs. No resolver is called. The violation is recorded in the audit trail with the exact matched pattern and policy name.
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-3">Output safety policy</h3>
              <p className="text-[14px] text-ink-4 mb-4 leading-relaxed">
                The kernel inspects LLM outputs before returning them. Built-in rules block responses that contain speculative data, PII, or content outside the declared scope.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { rule: "No PII in output",        detail: "Account numbers, routing numbers, SSNs stripped before returning." },
                  { rule: "No speculative balances",  detail: "Projected figures not sourced from a resolver are blocked." },
                  { rule: "No transaction confirmation", detail: "Any response implying a transaction occurred is rejected." },
                  { rule: "Scope enforcement",        detail: "Responses outside the declared intent scope are flagged and blocked." },
                ].map((item) => (
                  <div key={item.rule} className="rounded-[10px] bg-surface-2 border border-border p-4">
                    <p className="font-semibold text-[13px] text-ink mb-1">🛡 {item.rule}</p>
                    <p className="text-[12.5px] text-ink-4 leading-relaxed">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <hr className="border-border mb-16" />

          {/* ── KERNEL ARCHITECTURE ─────────────────────────────────────── */}
          <section id="kernel" className="mb-16 scroll-mt-24">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-[9px] bg-amber-50 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M21 12h-2M5 12H3M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M12 21v-2M12 5V3"/></svg>
              </div>
              <h2 className="font-syne text-[24px] font-bold text-ink tracking-[-0.5px]">Kernel Architecture</h2>
            </div>
            <p className="text-[15px] text-ink-4 leading-relaxed mb-8">
              The O-Lang kernel is the runtime between your workflow definition and tool execution. It parses, validates, governs, executes, and signs — in that order, every time, with no shortcuts. The <strong className="text-ink font-semibold">JavaScript kernel is stable and production-ready</strong>. It is language-agnostic: any tool or client can integrate over HTTP, regardless of runtime.
            </p>

            {/* Kernel status grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="rounded-[12px] border border-green/25 bg-green/5 p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green flex-shrink-0" />
                  <p className="font-syne font-bold text-[14px] text-green">JavaScript Kernel — Stable</p>
                </div>
                <p className="text-[13.5px] text-ink-4 leading-relaxed mb-3">
                  The JS kernel is complete, tested, and production-ready. It parses <code className="font-mono text-[12px] bg-white px-1 rounded border border-border">.ol</code> workflows, enforces governance policies, executes tool calls, and produces signed audit chains.
                </p>
                <div className="rounded-[8px] bg-[#0f172a] px-3 py-2 font-mono text-[12px] text-[#93c5fd]">
                  npm install @o-lang/kernel
                </div>
              </div>
              <div className="rounded-[12px] border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <p className="font-syne font-bold text-[14px] text-amber-700">Python Kernel — In Development</p>
                </div>
                <p className="text-[13.5px] text-amber-800/70 leading-relaxed mb-3">
                  A native Python kernel is under development for pip-native integration, familiar tooling, and seamless adoption in Python-first environments. Python tools can already integrate today via HTTP.
                </p>
                <div className="rounded-[8px] bg-amber-100 border border-amber-200 px-3 py-2 font-mono text-[12px] text-amber-700">
                  pip install olang-kernel &nbsp;<span className="opacity-50"># coming soon</span>
                </div>
              </div>
            </div>

            {/* HTTP bridge note */}
            <div className="rounded-[12px] bg-blue-light border border-blue/20 px-5 py-4 mb-10 flex items-start gap-3">
              <svg viewBox="0 0 20 20" fill="none" stroke="#1a56db" strokeWidth="1.8" className="w-4 h-4 mt-0.5 flex-shrink-0">
                <circle cx="10" cy="10" r="8"/><path d="M10 6v4l3 3"/>
              </svg>
              <p className="text-[13.5px] text-blue/80 leading-relaxed">
                <strong className="text-blue font-semibold">Language-agnostic by design.</strong>{" "}
                The JS kernel exposes a standard HTTP API — Python, Go, Rust, or any HTTP-capable runtime can call it directly.
                Python tools published on PyPI (like <code className="font-mono text-[12px] bg-white px-1 rounded border border-blue/20">olang-semantic-doc-search</code>) already use this bridge.
                The native Python kernel, when released, will wrap the same protocol in a pip-installable package for a seamless local experience.
              </p>
            </div>

            <div className="mb-10">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-4">Execution pipeline</h3>
              <div className="flex flex-col gap-3">
                {[
                  { step: "1", label: "Parse",   color: "#1a56db",
                    desc: "The .ol file is tokenised and validated against the O-Lang grammar. Malformed workflows are rejected here — nothing executes on a parse error.",
                    detail: "Output: AST with resolved step graph, input bindings, and governance profile." },
                  { step: "2", label: "Govern",  color: "#059669",
                    desc: "The tool allowlist, intent scope, prohibited actions, and safety policy are locked into an immutable governance profile. The profile hash is committed to the genesis audit block before execution.",
                    detail: "Output: gov_profile_hash committed to the genesis audit block." },
                  { step: "3", label: "Execute", color: "#7c3aed",
                    desc: "Steps run in declaration order. Each tool call is validated against the allowlist before dispatch. Outputs are schema-validated before being placed into context for the next step.",
                    detail: "Output: populated context object with all Save as variables resolved." },
                  { step: "4", label: "Sign",    color: "#d97706",
                    desc: "The final output is SHA3-256 fingerprinted and chained to the previous execution hash. If an ED25519 private key is configured, the chain is signed before returning.",
                    detail: "Output: execution_hash, merkle_root, and optional ED25519 signature." },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-4 bg-surface-2 border border-border rounded-[12px] px-5 py-4">
                    <span className="font-syne text-[24px] font-extrabold leading-none mt-0.5 flex-shrink-0 w-8 text-center" style={{ color: s.color }}>{s.step}</span>
                    <div className="flex-1">
                      <p className="font-syne font-bold text-[15px] text-ink mb-1">{s.label}</p>
                      <p className="text-[13.5px] text-ink-4 leading-relaxed mb-1.5">{s.desc}</p>
                      <p className="font-mono text-[11.5px] text-ink-5">{s.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-10">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-3">Audit chain format</h3>
              <p className="text-[14px] text-ink-4 mb-4 leading-relaxed">
                Every execution produces a linked hash chain. Each entry has a <code className="font-mono text-[13px] bg-surface-2 px-1.5 py-0.5 rounded text-blue border border-border">previousHash</code> pointing to the prior block, making the chain tamper-evident. A merkle root covers all entries.
              </p>
              <div className="rounded-[12px] bg-[#0f172a] border border-white/[0.08] p-5 overflow-x-auto">
                <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest mb-3">Audit response shape</p>
                <pre className="font-mono text-[13.5px] text-[#93c5fd] leading-[1.9]">{`{
  "execution_hash":          "sha3:a3f8c2d1e9b4...",
  "previous_hash":           "sha3:0000000000...",   // GENESIS on first run
  "governance_profile_hash": "sha256:7c2a1f...",
  "kernel_version":          "1.2.15-alpha",
  "merkle_root":             "sha256:4d9e8a...",
  "signature":               "ed25519:...",          // if key configured
  "integrity": {
    "valid":        true,
    "totalEntries": 2
  }
}`}</pre>
              </div>
            </div>

            <div className="mb-10">
              <h3 className="font-syne font-bold text-[15px] text-ink mb-3">Context isolation</h3>
              <p className="text-[14px] text-ink-4 leading-relaxed">
                Each workflow execution runs in an isolated context. Variables saved with <code className="font-mono text-[13px] bg-surface-2 px-1.5 py-0.5 rounded text-blue border border-border">Save as</code> are scoped to the execution and cannot bleed between concurrent runs. The kernel enforces this at the runtime level — it is not a convention.
              </p>
            </div>

            {/* Spec CTA */}
            <div className="rounded-[14px] bg-[#0f172a] border border-amber-500/20 p-6 flex items-center justify-between gap-6">
              <div>
                <p className="font-syne font-bold text-white text-[16px] mb-1">Official Kernel Specification — v1.1</p>
                <p className="text-[13.5px] text-white/50 leading-relaxed">
                  Full grammar reference, execution model, audit chain format, safety policy schema, resolver contract specification, and integration guide.
                </p>
              </div>
              <a href="https://o-lang-central.github.io/spec/v1.1.html" target="_blank" rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 text-[13px] font-bold text-amber-900 bg-amber-400 rounded-[9px] hover:bg-amber-300 transition-colors whitespace-nowrap">
                Read the spec ↗
              </a>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}