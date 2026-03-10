"use client";

import { useState } from "react";
import { RESOLVERS } from "@/lib/utils";
import type { Resolver, ResolverScope } from "@/types";

const FILTERS: { label: string; value: ResolverScope | "all" }[] = [
  { label: "All",        value: "all" },
  { label: "Finance",    value: "finance" },
  { label: "Healthcare", value: "health" },
  { label: "Legal",      value: "legal" },
  { label: "IoT",        value: "iot" },
  { label: "LLM",        value: "llm" },
  { label: "Utils",      value: "utils" },
];

// ── Submit Tool Modal ────────────────────────────────────────────────────────
function SubmitModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "", scope: "utils", description: "", repo: "", contact: "", runtime: "node",
  });
  const [submitted, setSubmitted] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.name || !form.description || !form.repo || !form.contact) return;
    setSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] overflow-hidden">
        <div className="bg-grad-hero px-7 py-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-grid opacity-[0.04] pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <span className="font-mono text-[11px] tracking-[1.2px] uppercase text-blue-muted block mb-1.5">Tool Registry</span>
              <h2 className="font-syne text-[22px] font-extrabold text-white leading-tight">Submit a tool</h2>
              <p className="text-white/50 text-[13.5px] mt-1">Node.js or Python — all runtimes welcome</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white/70 transition-colors mt-0.5 flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M4 4l12 12M16 4L4 16" />
              </svg>
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="px-7 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-green/10 flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" className="w-7 h-7"><path d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="font-syne text-[20px] font-extrabold text-ink mb-2">Submission received</h3>
            <p className="text-ink-4 text-[14px] leading-relaxed max-w-[340px] mx-auto">
              We&apos;ll independently re-run the full conformance suite (R-005 → R-012) against <span className="font-mono text-ink">{form.name}</span>, then review governance compatibility before approving listing.
              You&apos;ll hear back at <span className="font-mono text-ink">{form.contact}</span> within 3–5 business days.
            </p>
            <button onClick={onClose} className="mt-6 px-5 py-2.5 bg-blue text-white text-[14px] font-semibold rounded-[10px] hover:opacity-90 transition-opacity">Done</button>
          </div>
        ) : (
          <div className="px-7 py-6 flex flex-col gap-4">
            {/* Runtime */}
            <div>
              <label className="text-[12px] font-semibold text-ink-4 uppercase tracking-wider block mb-2">Runtime</label>
              <div className="flex gap-2">
                {[{ val: "node", label: "Node.js / npm" }, { val: "python", label: "Python / PyPI" }].map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => set("runtime", val)}
                    className={`px-4 py-2 rounded-[9px] text-[13px] font-semibold border-[1.5px] transition-all ${
                      form.runtime === val ? "bg-blue text-white border-blue" : "bg-surface-2 text-ink-4 border-border hover:border-blue hover:text-blue"
                    }`}
                  >{label}</button>
                ))}
              </div>
            </div>

            {/* Conformance note */}
            <div className="rounded-[10px] bg-blue-light border border-blue/20 px-4 py-3 flex items-start gap-2.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="#1a56db" strokeWidth="1.6" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0">
                <circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/>
              </svg>
              <p className="text-[12.5px] text-blue/80 leading-snug">
                Your resolver must pass the{" "}
                <a href="https://github.com/O-Lang-Central/resolver-test" target="_blank" rel="noopener noreferrer" className="underline font-semibold">O-Lang conformance test suite</a>
                {" "}and carry the certification badge before submitting.
              </p>
            </div>

            {/* Conformance note */}
            <div className="rounded-[10px] bg-blue-light border border-blue/20 px-4 py-3 flex items-start gap-2.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="#1a56db" strokeWidth="1.6" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0">
                <circle cx="8" cy="8" r="6"/><path d="M5 8l2 2 4-4"/>
              </svg>
              <p className="text-[12.5px] text-blue/80 leading-snug">
                Your resolver must pass the{" "}
                <a href="https://github.com/O-Lang-Central/resolver-test" target="_blank" rel="noopener noreferrer" className="underline font-semibold text-blue">O-Lang conformance test suite</a>
                {" "}and carry the certification badge before submitting.
              </p>
            </div>

            {/* Package name */}
            <div>
              <label className="text-[12px] font-semibold text-ink-4 uppercase tracking-wider block mb-1.5">
                {form.runtime === "node" ? "npm package name" : "PyPI package name"}
              </label>
              <input
                type="text"
                placeholder={form.runtime === "node" ? "@your-org/tool-name" : "your-package-name"}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                className="w-full border-[1.5px] border-border rounded-[10px] px-4 py-2.5 text-[14px] font-mono text-ink placeholder:text-ink-5 outline-none focus:border-blue transition-colors bg-surface-2"
              />
            </div>

            {/* Domain */}
            <div>
              <label className="text-[12px] font-semibold text-ink-4 uppercase tracking-wider block mb-1.5">Domain</label>
              <select
                value={form.scope}
                onChange={(e) => set("scope", e.target.value)}
                className="w-full border-[1.5px] border-border rounded-[10px] px-4 py-2.5 text-[14px] text-ink outline-none focus:border-blue transition-colors bg-surface-2"
              >
                <option value="finance">Finance</option>
                <option value="health">Healthcare</option>
                <option value="legal">Legal</option>
                <option value="iot">IoT</option>
                <option value="llm">LLM</option>
                <option value="utils">Utils / General</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="text-[12px] font-semibold text-ink-4 uppercase tracking-wider block mb-1.5">Short description</label>
              <textarea
                placeholder="What does this tool do? What governance policies does it enforce?"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={3}
                className="w-full border-[1.5px] border-border rounded-[10px] px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-5 outline-none focus:border-blue transition-colors bg-surface-2 resize-none"
              />
            </div>

            {/* Repo */}
            <div>
              <label className="text-[12px] font-semibold text-ink-4 uppercase tracking-wider block mb-1.5">Repository URL</label>
              <input
                type="url"
                placeholder="https://github.com/your-org/your-tool"
                value={form.repo}
                onChange={(e) => set("repo", e.target.value)}
                className="w-full border-[1.5px] border-border rounded-[10px] px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-5 outline-none focus:border-blue transition-colors bg-surface-2"
              />
            </div>

            {/* Contact */}
            <div>
              <label className="text-[12px] font-semibold text-ink-4 uppercase tracking-wider block mb-1.5">Contact email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.contact}
                onChange={(e) => set("contact", e.target.value)}
                className="w-full border-[1.5px] border-border rounded-[10px] px-4 py-2.5 text-[14px] text-ink placeholder:text-ink-5 outline-none focus:border-blue transition-colors bg-surface-2"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[12px] text-ink-5 leading-snug max-w-[280px]">
                Run olang-test --json locally first. All 8 tests (R-005 → R-012) must pass and badge.txt must be generated before submitting.
              </p>
              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.description || !form.repo || !form.contact}
                className="px-5 py-2.5 bg-blue text-white text-[14px] font-semibold rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                Submit tool →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export function RegistryPage() {
  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState<ResolverScope | "all">("all");
  const [showSubmit, setShowSubmit] = useState(false);

  const visible = RESOLVERS.filter((r) => {
    const matchFilter = filter === "all" || r.scope === filter;
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags.some((t) => t.includes(q));
    return matchFilter && matchQuery;
  });

  return (
    <div className="min-h-screen bg-surface-2 pt-16">
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}

      {/* ── Kernel in development banner ── */}
      <div className="bg-amber-50 border-b border-amber-200 px-[5%] py-3">
        <div className="max-w-[1160px] mx-auto flex items-center gap-3">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400/30 flex items-center justify-center">
            <svg viewBox="0 0 12 12" fill="#d97706" className="w-2.5 h-2.5"><circle cx="6" cy="6" r="5" /></svg>
          </span>
          <p className="text-[13px] text-amber-800 leading-snug">
            <span className="font-semibold">The O-Lang JS kernel is stable and ready to use.</span>
            {" "}It is language-agnostic — any language can call it over HTTP. Python tools can already integrate today via the HTTP bridge.{" "}
            A <span className="font-mono text-[12px] bg-amber-100 border border-amber-200 rounded px-1.5 py-0.5">native Python kernel</span> is under active development for seamless pip-native integration.{" "}
            <a href="/docs#kernel" className="underline underline-offset-2 hover:text-amber-900 transition-colors font-medium">Learn more ↗</a>
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="bg-grad-hero px-[5%] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-grid opacity-[0.04] pointer-events-none" />
        <div className="max-w-[1160px] mx-auto relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="font-mono text-[11px] tracking-[1.2px] uppercase text-blue-muted block mb-3">Tool Registry</span>
            <h1 className="font-syne text-[42px] font-extrabold tracking-[-1.5px] text-white leading-tight mb-3">
              Governed tools,<br />ready to use
            </h1>
            <p className="text-white/55 text-[17px] max-w-[520px] leading-relaxed">
              Every tool is schema-validated, version-pinned, and signed before listing. Available for{" "}
              <code className="font-mono text-blue-muted bg-white/[0.08] px-1.5 py-0.5 rounded text-[14px]">npm</code>
              {" "}and{" "}
              <code className="font-mono text-blue-muted bg-white/[0.08] px-1.5 py-0.5 rounded text-[14px]">pip</code>.
            </p>
            <p className="text-white/30 text-[13px] mt-2 font-mono">
              In O-Lang, tools are called <span className="text-blue-muted/60">resolvers</span> —{" "}
              <a href="/docs" className="underline underline-offset-2 hover:text-white/50 transition-colors">learn why in the docs ↗</a>
            </p>
          </div>
          <button
            onClick={() => setShowSubmit(true)}
            className="flex items-center gap-2.5 px-5 py-3 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white text-[14px] font-semibold rounded-[12px] transition-all flex-shrink-0"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <circle cx="10" cy="10" r="8" /><path d="M10 6v8M6 10h8" />
            </svg>
            Submit a tool
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="sticky top-16 z-40 bg-white border-b border-border px-[5%] py-4 shadow-sm">
        <div className="max-w-[1160px] mx-auto flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5 bg-surface-2 border-[1.5px] border-border-2 rounded-[10px] px-4 py-2.5 w-[340px] max-w-full">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 text-ink-5 flex-shrink-0">
              <circle cx="9" cy="9" r="6" /><path d="M15 15l4 4" />
            </svg>
            <input
              type="text"
              placeholder="Search tools, tags, authors…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-none outline-none bg-transparent text-[14px] text-ink placeholder:text-ink-5 flex-1 font-sans"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold border-[1.5px] transition-all ${
                  filter === f.value ? "bg-blue text-white border-blue" : "bg-white text-ink-4 border-border hover:border-blue hover:text-blue"
                }`}
              >{f.label}</button>
            ))}
          </div>
          <span className="ml-auto text-[13px] text-ink-5 hidden md:block">
            {visible.length} resolver{visible.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="px-[5%] py-10">
        <div className="max-w-[1160px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((r: Resolver) => (
            <div
              key={r.name}
              className="bg-white border-[1.5px] border-border rounded-2xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-border-2 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-syne text-[13px] font-extrabold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg,${r.bgColor},${r.color})` }}
                >
                  {r.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[13px] font-medium text-ink truncate">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[11px] text-ink-5">{r.scope}</span>
                    {r.pypi && (
                      <span className="text-[10.5px] font-semibold text-blue bg-blue/8 border border-blue/20 px-1.5 py-0.5 rounded font-mono">
                        PyPI
                      </span>
                    )}
                    {r.verified && r.status !== "planned" && (
                      <span className="flex items-center gap-1 text-[11px] text-green font-semibold">
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M2 6l3 3 5-5" /></svg>
                        verified
                      </span>
                    )}
                    {r.status === "planned" && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#f59e0b" }}>
                        <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5">
                          <circle cx="6" cy="6" r="5" fillOpacity="0.3" /><circle cx="6" cy="6" r="2" />
                        </svg>
                        planned
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-ink-5 flex-shrink-0">v{r.version}</span>
              </div>

              <p className="text-[13.5px] text-ink-4 leading-relaxed mb-4">{r.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 flex-wrap">
                  {r.tags.map((t) => (
                    <span key={t} className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-surface-3 text-ink-5 border border-border">{t}</span>
                  ))}
                </div>
                {r.downloads != null && r.downloads > 0 && (
                  <span className="text-[12px] text-ink-5 flex items-center gap-1 ml-2">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M8 2v8M5 7l3 3 3-3M3 12h10" /></svg>
                    {r.downloads.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Install snippet */}
              <div className="mt-4 bg-surface-3 border border-border rounded-lg px-3 py-2 font-mono text-[11.5px] text-ink-4 flex items-center justify-between gap-2">
                <span className="truncate">{r.pypi ? `pip install ${r.name}` : `npm install ${r.name}`}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(r.pypi ? `pip install ${r.name}` : `npm install ${r.name}`)}
                  className="text-ink-5 hover:text-ink transition-colors flex-shrink-0"
                  title="Copy"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                    <rect x="4" y="4" width="8" height="8" rx="2" /><path d="M8 2H6a2 2 0 00-2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {visible.length === 0 && (
            <div className="col-span-3 text-center py-20 text-ink-5">
              <p className="text-[16px] font-semibold mb-2">No tools found</p>
              <p className="text-[14px]">Try a different search term or filter</p>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="max-w-[1160px] mx-auto mt-14 rounded-2xl border-[1.5px] border-border bg-white overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-5 border-b border-border">
            <h3 className="font-syne text-[20px] font-extrabold text-ink mb-1.5">Built a governed tool?</h3>
            <p className="text-ink-4 text-[14.5px] leading-relaxed max-w-[560px]">
              Node.js, Python, or any JSON-capable runtime is welcome. Your resolver must pass the conformance suite (R-005 → R-012) and generate a certification badge locally first.
              The O-Lang team then independently re-runs the full suite before approving your listing.
            </p>
          </div>

          {/* 3-step publish flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            {([
              {
                num: "1", color: "#1a56db",
                title: "Run the conformance tests",
                body: "Install the test runner and run all 8 conformance tests (R-005 → R-012) against your resolver. Tests enforce metadata, runtime shape, failure contract, input validation, retry semantics, output contract, determinism, and side-effect safety.",
                code: "pip install olang-resolver-test && olang-test --json",
                link: "https://github.com/O-Lang-Central/resolver-test",
                linkLabel: "Test suite on GitHub ↗",
              },
              {
                num: "2", color: "#059669",
                title: "Earn your certification badge",
                body: "A certification badge (badge.txt) is generated automatically when all 8 tests pass. Include it in your repo README to confirm O-Lang CERTIFIED status before submitting.",
                code: "🎉 Resolver is O-Lang CERTIFIED\n🏷️  Badge generated: badge.txt",
                link: "https://medium.com/@o-lang/olang-resolver-certification-essay",
                linkLabel: "Read the conformance essay ↗",
              },
              {
                num: "3", color: "#7c3aed",
                title: "Submit for O-Lang review",
                body: "Submit your certified resolver. The O-Lang team independently re-runs the full conformance suite (R-005 → R-012) and reviews governance compatibility. Once approved, your tool receives a verified badge and appears in the registry.",
                code: null, link: null, linkLabel: null, cta: true,
              },
            ] as const).map(({ num, color, title, body, code, link, linkLabel, ...rest }) => (
              <div key={num} className="px-6 py-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center font-syne font-extrabold text-[13px] text-white flex-shrink-0"
                    style={{ background: color }}
                  >{num}</span>
                  <p className="font-syne font-bold text-[14.5px] text-ink">{title}</p>
                </div>
                <p className="text-[13.5px] text-ink-4 leading-relaxed mb-3">{body}</p>
                {code && (
                  <div className="rounded-[8px] bg-[#0f172a] px-3 py-2 font-mono text-[11.5px] text-[#93c5fd] mb-3 overflow-x-auto whitespace-pre">
                    {code}
                  </div>
                )}
                {link && (
                  <a href={link} target="_blank" rel="noopener noreferrer"
                    className="text-[12.5px] font-semibold underline underline-offset-2 transition-colors"
                    style={{ color }}
                  >{linkLabel}</a>
                )}
                {"cta" in rest && rest.cta && (
                  <button
                    onClick={() => setShowSubmit(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-white text-[13.5px] font-semibold rounded-[10px] hover:opacity-90 transition-opacity"
                    style={{ background: color }}
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <circle cx="10" cy="10" r="8" /><path d="M10 6v8M6 10h8" />
                    </svg>
                    Submit your tool
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}