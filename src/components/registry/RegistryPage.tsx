"use client";

import { useState } from "react";
import { RESOLVERS } from "@/lib/utils";
import type { ResolverScope } from "@/types";

const FILTERS: { label: string; value: ResolverScope | "all" }[] = [
  { label: "All",        value: "all" },
  { label: "Finance",    value: "finance" },
  { label: "Healthcare", value: "health" },
  { label: "Legal",      value: "legal" },
  { label: "LLM",        value: "llm" },
  { label: "Utils",      value: "utils" },
];

export function RegistryPage() {
  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState<ResolverScope | "all">("all");

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
      {/* Header */}
      <div className="bg-grad-hero px-[5%] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-grid opacity-[0.04] pointer-events-none" />
        <div className="max-w-[1160px] mx-auto relative z-10">
          <span className="font-mono text-[11px] tracking-[1.2px] uppercase text-blue-muted block mb-3">
            Tool Registry
          </span>
          <h1 className="font-syne text-[42px] font-extrabold tracking-[-1.5px] text-white leading-tight mb-3">
            Governed tools,<br />ready to use
          </h1>
          <p className="text-white/55 text-[17px] max-w-[520px] leading-relaxed">
            Every tool is schema-validated, version-pinned, and signed before listing.
            Install with <code className="font-mono text-blue-muted bg-white/[0.08] px-1.5 py-0.5 rounded text-[14px]">npm install @o-lang/tool-name</code>
          </p>
          <p className="text-white/30 text-[13px] mt-2 font-mono">
            In O-Lang, tools are called <span className="text-blue-muted/60">resolvers</span> —{" "}
            <a href="/docs" className="underline underline-offset-2 hover:text-white/50 transition-colors">learn why in the docs ↗</a>
          </p>
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
                  filter === f.value
                    ? "bg-blue text-white border-blue"
                    : "bg-white text-ink-4 border-border hover:border-blue hover:text-blue"
                }`}
              >
                {f.label}
              </button>
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
          {visible.map((r) => (
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-ink-5">{r.scope}</span>
                    {r.verified && r.status !== "planned" && (
                      <span className="flex items-center gap-1 text-[11px] text-green font-semibold">
                        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                        verified
                      </span>
                    )}
                    {r.status === "planned" && (
                      <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#f59e0b" }}>
                        <svg viewBox="0 0 12 12" fill="currentColor" className="w-2.5 h-2.5">
                          <circle cx="6" cy="6" r="5" fillOpacity="0.3" />
                          <circle cx="6" cy="6" r="2" />
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
                    <span
                      key={t}
                      className="font-mono text-[10.5px] px-2 py-0.5 rounded bg-surface-3 text-ink-5 border border-border"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                {r.downloads && (
                  <span className="text-[12px] text-ink-5 flex items-center gap-1 ml-2">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                      <path d="M8 2v8M5 7l3 3 3-3M3 12h10" />
                    </svg>
                    {r.downloads.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Install snippet */}
              <div className="mt-4 bg-surface-3 border border-border rounded-lg px-3 py-2 font-mono text-[11.5px] text-ink-4 flex items-center justify-between gap-2">
                <span className="truncate">npm install {r.name}</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(`npm install ${r.name}`)}
                  className="text-ink-5 hover:text-ink transition-colors flex-shrink-0"
                  title="Copy"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                    <rect x="4" y="4" width="8" height="8" rx="2" />
                    <path d="M8 2H6a2 2 0 00-2 2v2" />
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
      </div>
    </div>
  );
}