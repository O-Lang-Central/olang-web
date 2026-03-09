"use client";

import { useState } from "react";
import Link from "next/link";
import { RESOLVERS } from "@/lib/utils";
import { SectionHeader } from "@/components/ui";
import type { ResolverScope } from "@/types";

const FILTERS: { label: string; value: ResolverScope | "all" }[] = [
  { label: "All",        value: "all" },
  { label: "Finance",    value: "finance" },
  { label: "Healthcare", value: "health" },
  { label: "Legal",      value: "legal" },
  { label: "LLM",        value: "llm" },
];

export function RegistryPreview() {
  const [query,  setQuery]  = useState("");
  const [filter, setFilter] = useState<ResolverScope | "all">("all");

  const visible = RESOLVERS.filter((r) => {
    const matchFilter = filter === "all" || r.scope === filter;
    const q = query.toLowerCase();
    const matchQuery = !q || r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some((t) => t.includes(q));
    return matchFilter && matchQuery;
  });

  return (
    <section className="py-24 px-[5%] bg-surface-2" id="registry">
      <div className="max-w-[1160px] mx-auto">
        <SectionHeader
          eyebrow="Tool Registry"
          title={<>Discover and publish<br />governed tools</>}
          subtitle="Every tool in the registry is schema-validated, version-pinned, and signed. Drop it into any workflow with a single import."
        />

        {/* Search + filters */}
        <div className="flex flex-wrap items-end justify-between gap-4 mt-8 mb-6 reveal">
          <div className="flex items-center gap-2.5 bg-white border-[1.5px] border-border-2 rounded-[10px] px-4 py-2.5 w-[320px] max-w-full shadow-sm">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4 text-ink-5 flex-shrink-0">
              <circle cx="9" cy="9" r="6"/><path d="M15 15l4 4"/>
            </svg>
            <input
              type="text"
              placeholder="Search tools…"
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
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 reveal">
          {visible.map((r) => (
            <div
              key={r.name}
              className="bg-white border-[1.5px] border-border rounded-2xl p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-border-2 transition-all cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-9 h-9 rounded-[9px] flex items-center justify-center text-white font-syne text-[13px] font-extrabold flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${r.bgColor}, ${r.color})` }}
                >
                  {r.initials}
                </div>
                <div>
                  <p className="font-mono text-[13px] font-medium text-ink leading-tight">{r.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-ink-5">{r.scope}</span>
                    {r.status === "planned" && (
                      <span className="flex items-center gap-1 text-[10.5px] text-amber-500 font-medium font-mono">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                        planned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-[13px] text-ink-4 leading-[1.55] mb-3.5">{r.description}</p>

              {/* Footer */}
              <div className="flex items-center gap-2 flex-wrap">
                {r.tags.map((t) => (
                  <span key={t} className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-surface-3 text-ink-5 border border-border">{t}</span>
                ))}
                <span className="font-mono text-[10.5px] text-ink-5 ml-auto">v{r.version}</span>
                {r.verified && r.status !== "planned" && (
                  <span className="flex items-center gap-1 text-[11px] text-green font-medium">
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M2 6l3 3 5-5"/></svg>
                    verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-9">
          <Link
            href="/registry"
            className="inline-flex items-center gap-2.5 px-7 py-3 text-[15px] font-semibold text-blue bg-white border-[1.5px] border-blue rounded-[10px] hover:bg-blue-light hover:-translate-y-px transition-all"
          >
            Browse full tool registry
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M4 10h12M10 4l6 6-6 6"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}