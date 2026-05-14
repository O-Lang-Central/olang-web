"use client";

import { motion } from "framer-motion";

const ALTERNATIVES = [
  {
    name: "LangChain",
    color: "#22c55e",
    what: "Builds LLM pipelines and chains tool calls together",
    missing:
      "No enforcement of what tools can actually do. Any step can call anything.",
    olang:
      "Governs LangChain's tool calls, enforces resolver allowlists at runtime, and lets teams swap AI models without rewriting workflows.",
  },
  {
    name: "LlamaIndex",
    color: "#f59e0b",
    what: "Indexes documents and retrieves context for RAG",
    missing:
      "No policy layer. Retrieved context flows into LLM without validation.",
    olang:
      "Wraps LlamaIndex retrieval with audit trails, output safety checks, and provider portability across models.",
  },
  {
    name: "OpenAI Agents",
    color: "#a78bfa",
    what: "Orchestrates multi-step AI agents with tool use",
    missing:
      "No cryptographic proof of what ran. No replay. No tamper-evident log.",
    olang:
      "Adds replayable execution, Merkle-signed audit trails, and stable workflows even when switching AI providers.",
  },
  {
    name: "Guardrails AI",
    color: "#60a5fa",
    what: "Validates LLM outputs against schemas and rules",
    missing:
      "Output-only. Doesn't govern the workflow or resolver chain that produced it.",
    olang:
      "Governs the full execution lifecycle — inputs, resolvers, outputs, and model portability across providers.",
  },
];

const MATRIX = [
  {
    feature: "Resolver allowlists",
    langchain: false,
    llamaindex: false,
    openai: false,
    guardrails: false,
    olang: true,
  },
  {
    feature: "Cryptographic audit trail",
    langchain: false,
    llamaindex: false,
    openai: false,
    guardrails: false,
    olang: true,
  },
  {
    feature: "Replayable execution",
    langchain: false,
    llamaindex: false,
    openai: false,
    guardrails: false,
    olang: true,
  },
  {
    feature: "Merkle + RSA signing",
    langchain: false,
    llamaindex: false,
    openai: false,
    guardrails: false,
    olang: true,
  },
  {
    feature: "Swap models without rewrites",
    langchain: false,
    llamaindex: false,
    openai: false,
    guardrails: false,
    olang: true,
  },
  {
    feature: "Provider portability",
    langchain: false,
    llamaindex: false,
    openai: false,
    guardrails: false,
    olang: true,
  },
  {
    feature: "PII redaction 20+ langs",
    langchain: false,
    llamaindex: false,
    openai: false,
    guardrails: true,
    olang: true,
  },
  {
    feature: "Works with existing tools",
    langchain: true,
    llamaindex: true,
    openai: true,
    guardrails: true,
    olang: true,
  },
  {
    feature: "Multi-locale formatting",
    langchain: false,
    llamaindex: false,
    openai: false,
    guardrails: false,
    olang: true,
  },
  {
    feature: "ISO 42001 aligned",
    langchain: false,
    llamaindex: false,
    openai: false,
    guardrails: false,
    olang: true,
  },
];

const Check = ({ value }: { value: boolean }) =>
  value ? (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full"
      style={{
        background: "rgba(52,211,153,0.12)",
        border: "1px solid rgba(52,211,153,0.35)",
      }}
    >
      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
        <path
          d="M2.5 6l2.5 2.5 4.5-5"
          stroke="rgba(52,211,153,1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  ) : (
    <span
      className="inline-flex items-center justify-center w-5 h-5 rounded-full"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
        <path
          d="M3.5 3.5l5 5M8.5 3.5l-5 5"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );

export function ComparisonSection() {
  return (
    <section
      id="compare"
      className="py-24 px-[5%] border-t"
      style={{
        background: "linear-gradient(180deg, #050c18 0%, #060d1a 100%)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <p className="font-mono text-[11px] text-blue-400 uppercase tracking-[0.4px] mb-4">
            O-Lang vs Alternatives
          </p>

          <h2 className="font-syne text-[clamp(28px,4vw,48px)] font-extrabold tracking-[-1.5px] text-white mb-4 leading-[1.1]">
            LangChain builds pipelines.
            <br />
            LlamaIndex builds indexes.
            <br />
            <span className="text-grad-blue">
              O-Lang governs both.
            </span>
          </h2>

          <p className="text-[16px] text-white/65 max-w-[680px] mx-auto leading-relaxed">
            O-Lang wraps your existing AI stack with governance,
            cryptographic audit trails, and provider portability —
            allowing teams to switch AI models without disrupting
            workflows or rebuilding infrastructure.
          </p>
        </motion.div>

        {/* Model portability strip */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="rounded-[18px] p-6 md:p-8 mb-14 overflow-hidden relative"
          style={{
            background:
              "linear-gradient(135deg, rgba(26,86,219,0.12) 0%, rgba(16,24,40,1) 100%)",
            border: "1px solid rgba(96,165,250,0.18)",
          }}
        >
          <div className="relative z-10">
            <p className="font-mono text-[11px] text-blue-300 uppercase tracking-[0.3em] mb-4">
              Provider Portability
            </p>

            <h3 className="font-syne text-[clamp(24px,3vw,36px)] font-bold text-white leading-[1.15] mb-4">
              AI providers change.
              <br />
              Your workflows shouldn&apos;t.
            </h3>

            <p className="text-white/70 text-[15px] leading-relaxed max-w-[720px] mb-8">
              OpenAI today. Claude tomorrow. Local models next year.
              O-Lang abstracts execution so your applications remain
              stable even when models, APIs, or providers evolve.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                "OpenAI",
                "Claude",
                "Gemini",
                "Mistral",
                "Llama",
                "Local Models",
              ].map((provider) => (
                <div
                  key={provider}
                  className="rounded-[12px] px-4 py-3 flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span className="text-white/80 text-[14px] font-medium">
                    {provider}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14 reveal">
          {ALTERNATIVES.map(
            ({ name, color, what, missing, olang }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="rounded-[16px] p-6 flex flex-col gap-4"
                style={{
                  background:
                    "linear-gradient(135deg, #0a1628 0%, #0d1b2e 100%)",
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              >
                {/* Name */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-8 rounded-full shrink-0"
                    style={{ background: color, opacity: 0.8 }}
                  />

                  <span className="font-syne text-[17px] font-bold text-white">
                    {name}
                  </span>
                </div>

                {/* What it does */}
                <div className="space-y-1">
                  <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
                    What it does
                  </p>

                  <p className="text-[14px] text-white/70 leading-relaxed">
                    {what}
                  </p>
                </div>

                {/* Missing */}
                <div
                  className="rounded-[10px] px-4 py-3 space-y-1"
                  style={{
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.20)",
                  }}
                >
                  <p className="font-mono text-[10px] text-red-400 uppercase tracking-widest">
                    Governance gap
                  </p>

                  <p className="text-[13px] text-red-300/90 leading-relaxed">
                    {missing}
                  </p>
                </div>

                {/* O-Lang */}
                <div
                  className="rounded-[10px] px-4 py-3 space-y-1"
                  style={{
                    background: "rgba(52,211,153,0.07)",
                    border: "1px solid rgba(52,211,153,0.22)",
                  }}
                >
                  <p className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">
                    O-Lang adds
                  </p>

                  <p className="text-[13px] text-emerald-300/90 leading-relaxed">
                    {olang}
                  </p>
                </div>
              </motion.div>
            )
          )}
        </div>

        {/* Feature matrix */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[18px] overflow-hidden reveal"
          style={{
            background:
              "linear-gradient(135deg, #0a1628 0%, #0d1b2e 100%)",
            border: "1px solid rgba(255,255,255,0.10)",
          }}
        >
          {/* Header */}
          <div
            className="grid grid-cols-[1fr_repeat(5,80px)] gap-0"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="px-6 py-4">
              <p className="font-mono text-[11px] text-white/50 uppercase tracking-widest">
                Feature
              </p>
            </div>

            {[
              "LangChain",
              "LlamaIndex",
              "OpenAI",
              "Guardrails",
              "O-Lang",
            ].map((col, i) => (
              <div
                key={col}
                className="px-2 py-4 text-center"
                style={{
                  borderLeft:
                    "1px solid rgba(255,255,255,0.08)",
                  background:
                    i === 4
                      ? "rgba(26,86,219,0.08)"
                      : "transparent",
                }}
              >
                <p
                  className="font-mono text-[10px] uppercase tracking-widest"
                  style={{
                    color:
                      i === 4
                        ? "rgba(96,165,250,1)"
                        : "rgba(255,255,255,0.45)",
                  }}
                >
                  {col}
                </p>
              </div>
            ))}
          </div>

          {/* Rows */}
          {MATRIX.map(
            (
              {
                feature,
                langchain,
                llamaindex,
                openai,
                guardrails,
                olang,
              },
              i
            ) => (
              <div
                key={feature}
                className="grid grid-cols-[1fr_repeat(5,80px)] gap-0"
                style={{
                  borderBottom:
                    "1px solid rgba(255,255,255,0.06)",
                  background:
                    i % 2 === 0
                      ? "rgba(255,255,255,0.015)"
                      : "transparent",
                }}
              >
                <div className="px-6 py-3.5 flex items-center">
                  <p className="text-[13px] text-white/75">
                    {feature}
                  </p>
                </div>

                {[
                  langchain,
                  llamaindex,
                  openai,
                  guardrails,
                  olang,
                ].map((val, j) => (
                  <div
                    key={j}
                    className="px-2 py-3.5 flex items-center justify-center"
                    style={{
                      borderLeft:
                        "1px solid rgba(255,255,255,0.06)",
                      background:
                        j === 4
                          ? "rgba(26,86,219,0.05)"
                          : "transparent",
                    }}
                  >
                    <Check value={val} />
                  </div>
                ))}
              </div>
            )
          )}

          {/* Footer */}
          <div
            className="grid grid-cols-[1fr_repeat(5,80px)]"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.025)",
            }}
          >
            <div className="px-6 py-4">
              <p className="font-mono text-[11px] text-white/45 uppercase tracking-widest">
                Governance score
              </p>
            </div>

            {[
              {
                score: "1/10",
                color: "rgba(255,255,255,0.30)",
              },
              {
                score: "1/10",
                color: "rgba(255,255,255,0.30)",
              },
              {
                score: "1/10",
                color: "rgba(255,255,255,0.30)",
              },
              {
                score: "2/10",
                color: "rgba(255,255,255,0.45)",
              },
              {
                score: "10/10",
                color: "rgba(52,211,153,1)",
                bold: true,
              },
            ].map(({ score, color, bold }, i) => (
              <div
                key={i}
                className={`px-2 py-4 flex items-center justify-center font-mono text-[12px] ${
                  bold ? "font-bold" : ""
                }`}
                style={{
                  borderLeft:
                    "1px solid rgba(255,255,255,0.08)",
                  background:
                    i === 4
                      ? "rgba(26,86,219,0.08)"
                      : "transparent",
                  color,
                }}
              >
                {score}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom note */}
        <p className="text-center text-[13px] text-white/50 mt-6 leading-relaxed">
          O-Lang is not a replacement — it&apos;s a portable AI
          governance layer.
          <span className="text-white/65">
            {" "}
            Use it alongside any framework, model, or provider you
            already run.
          </span>
        </p>
      </div>
    </section>
  );
}