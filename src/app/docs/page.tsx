import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Docs — O-Lang",
  description: "O-Lang documentation — quickstart, resolver guides, governance deep dive, kernel architecture.",
};

const DOCS = [
  {
    section: "Getting Started",
    items: [
      { slug: "quickstart",    title: "Quickstart Guide",       sub: "Install the kernel, write your first .ol file, run it in 5 minutes" },
      { slug: "concepts",      title: "Core Concepts",          sub: "Workflows, resolvers, governance layers, symbol resolution" },
      { slug: "installation",  title: "Installation",           sub: "npm, yarn, pnpm — local and cloud kernel setup" },
    ],
  },
  {
    section: "Workflows",
    items: [
      { slug: "workflow-syntax", title: "Workflow Syntax",      sub: "Full .ol file grammar reference" },
      { slug: "governance",      title: "Governance Block",     sub: "@governance, allowlists, prohibited actions, audit flags" },
      { slug: "steps",           title: "Steps & Symbols",      sub: "Composing resolver chains with typed symbol resolution" },
    ],
  },
  {
    section: "Resolvers",
    items: [
      { slug: "resolvers",       title: "Building Resolvers",   sub: "Write, schema-validate, and publish resolvers" },
      { slug: "resolver-schema", title: "Resolver Schema",      sub: "Input/output type declarations" },
      { slug: "publishing",      title: "Publishing",           sub: "Version, sign, and publish to the registry" },
    ],
  },
  {
    section: "Governance & Safety",
    items: [
      { slug: "verified-intent", title: "Verified Intent",      sub: "Scope declarations, prohibited output, enforcement" },
      { slug: "safety-policy",   title: "Safety Policy Engine", sub: "PII validation, hallucination prevention, prompt injection blocking" },
      { slug: "audit-trail",     title: "Audit Trail",          sub: "SHA3-256 fingerprinting, ED25519 signing, execution chains" },
    ],
  },
  {
    section: "Kernel",
    items: [
      { slug: "kernel",          title: "Kernel Architecture",  sub: "Runtime internals, execution model, embedding" },
      { slug: "self-hosting",    title: "Self-Hosting",         sub: "Run the kernel on your own infrastructure" },
      { slug: "api-reference",   title: "API Reference",        sub: "Full REST API docs for the kernel server" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-surface-2 pt-16">
      {/* Header */}
      <div className="bg-grad-hero px-[5%] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-grid opacity-[0.04] pointer-events-none" />
        <div className="max-w-[1160px] mx-auto relative z-10">
          <span className="font-mono text-[11px] tracking-[1.2px] uppercase text-blue-muted block mb-3">Documentation</span>
          <h1 className="font-syne text-[42px] font-extrabold tracking-[-1.5px] text-white leading-tight mb-3">
            O-Lang Documentation
          </h1>
          <p className="text-white/55 text-[17px] max-w-[480px] leading-relaxed">
            Everything you need to build, deploy, and audit governed AI workflows.
          </p>
        </div>
      </div>

      {/* Doc sections */}
      <div className="px-[5%] py-12">
        <div className="max-w-[1160px] mx-auto flex flex-col gap-12">
          {DOCS.map((section) => (
            <div key={section.section}>
              <h2 className="font-syne text-[13px] font-bold tracking-[1px] uppercase text-ink-5 mb-5">
                {section.section}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {section.items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/docs/${item.slug}`}
                    className="bg-white border-[1.5px] border-border rounded-2xl p-6 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:border-border-2 transition-all"
                  >
                    <h3 className="font-syne text-[16px] font-bold text-ink mb-2">{item.title}</h3>
                    <p className="text-[13.5px] text-ink-4 leading-relaxed">{item.sub}</p>
                    <span className="inline-flex items-center gap-1.5 text-blue text-[13px] font-semibold mt-4">
                      Read →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
