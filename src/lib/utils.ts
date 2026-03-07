import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DomainConfig, Resolver } from "@/types";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deterministic fake hash for demo/showcase (not crypto-secure) */
export function fakeHash(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(h).toString(16).padStart(8, "0");
  return "sha3-256:" + hex.repeat(8);
}

/** Format ISO timestamp to short display */
export function shortTime(iso: string): string {
  return new Date(iso).toTimeString().slice(0, 12) + "Z";
}

// ── RESOLVER REGISTRY DATA ─────────────────────────────────────────────────
export const RESOLVERS: Resolver[] = [
  // ── Live ──────────────────────────────────────────────────────────────────
  {
    name: "@o-lang/bank-account-lookup",
    scope: "finance",
    version: "1.2.1",
    description: "Secure account balance and transaction lookup with PII validation and multi-jurisdiction audit compliance.",
    tags: ["finance", "pii", "sqlite"],
    verified: true,
    status: "live",
    color: "#1a56db",
    bgColor: "#1245b8",
    initials: "BL",
    downloads: 1420,
    author: "o-lang-core",
  },
  {
    name: "@o-lang/icu-admission",
    scope: "health",
    version: "1.1.0",
    description: "ICU bed management, team-scoped admission, and HIPAA-compliant patient data handling.",
    tags: ["healthcare", "hipaa", "beds"],
    verified: true,
    status: "live",
    color: "#059669",
    bgColor: "#047857",
    initials: "IC",
    downloads: 874,
    author: "o-lang-core",
  },
  {
    name: "@o-lang/llm-groq",
    scope: "llm",
    version: "2.0.3",
    description: "Fast, governed LLM inference via Groq. Output schema-validated and hallucination-filtered.",
    tags: ["llm", "groq", "fast"],
    verified: true,
    status: "live",
    color: "#f97316",
    bgColor: "#ea580c",
    initials: "GQ",
    downloads: 3211,
    author: "o-lang-core",
  },
  {
    name: "@o-lang/notify-telegram",
    scope: "utils",
    version: "1.0.0",
    description: "Send governed notifications to Telegram channels or users. Rate-limited, audit-logged, and allowlist-enforced.",
    tags: ["notify", "telegram", "messaging"],
    verified: true,
    status: "live",
    color: "#0088cc",
    bgColor: "#006da8",
    initials: "TG",
    downloads: 618,
    author: "o-lang-core",
  },
  {
    name: "@o-lang/semantic-doc-search",
    scope: "utils",
    version: "1.0.2",
    description: "Vector-based semantic document search with scoped retrieval. Prevents out-of-context document access.",
    tags: ["search", "vector", "rag"],
    verified: true,
    status: "live",
    color: "#8b5cf6",
    bgColor: "#7c3aed",
    initials: "SD",
    downloads: 490,
    author: "o-lang-core",
  },
  {
    name: "@o-lang/js-olang-tester",
    scope: "utils",
    version: "1.0.0",
    description: "Unit and integration test harness for O-Lang workflows. Simulates resolver chains and validates governance policy enforcement.",
    tags: ["testing", "dev", "javascript"],
    verified: true,
    status: "live",
    color: "#eab308",
    bgColor: "#ca8a04",
    initials: "JT",
    downloads: 305,
    author: "o-lang-core",
  },
  {
    name: "@o-lang/python-olang-tester",
    scope: "utils",
    version: "1.0.0",
    description: "Python test harness for O-Lang workflows. Available on PyPI. Validates resolver behaviour and policy compliance from Python environments.",
    tags: ["testing", "dev", "python", "pypi"],
    verified: true,
    status: "live",
    color: "#3b82f6",
    bgColor: "#2563eb",
    initials: "PT",
    downloads: 214,
    author: "o-lang-core",
  },
  // ── Planned ───────────────────────────────────────────────────────────────
  {
    name: "@o-lang/legal-extract",
    scope: "legal",
    version: "1.0.5",
    description: "Extract-only legal document analysis. Blocks legal advice output under GDPR, UK Companies Act, US Federal, and other jurisdictions.",
    tags: ["legal", "extract", "governance"],
    verified: false,
    status: "planned",
    color: "#7c3aed",
    bgColor: "#6d28d9",
    initials: "LE",
    downloads: 0,
    author: "o-lang-core",
  },
  {
    name: "@o-lang/llm-openai",
    scope: "llm",
    version: "1.3.0",
    description: "OpenAI GPT-4o resolver with output schema enforcement and rate-limit-aware execution.",
    tags: ["llm", "openai", "gpt4o"],
    verified: false,
    status: "planned",
    color: "#0891b2",
    bgColor: "#0e7490",
    initials: "OA",
    downloads: 0,
    author: "o-lang-core",
  },
  {
    name: "@o-lang/pii-validator",
    scope: "finance",
    version: "1.1.2",
    description: "Global PII validation across 40+ identity formats: SSN, NIN, BVN, NHI, TFN, Aadhaar, and more.",
    tags: ["pii", "global", "validation"],
    verified: false,
    status: "planned",
    color: "#d97706",
    bgColor: "#b45309",
    initials: "PV",
    downloads: 0,
    author: "o-lang-core",
  },
];

// ── DOMAIN CONFIG ──────────────────────────────────────────────────────────
export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  finance: {
    id: "finance",
    title: "Bank Balance Workflow",
    accent: "#1a56db",
    gradient: "linear-gradient(135deg, #1245b8, #1a56db)",
    badge: "FINANCE",
    endpoint: "/execute/bank_balance",
    fields: [
      { id: "customer_id",   label: "Customer ID",   placeholder: "e.g. CUST-001",       required: true,  type: "text" },
      { id: "user_question", label: "Query",         placeholder: "What is my balance?",  required: true,  type: "text" },
    ],
    intent: {
      scope: "customer_balance_inquiry",
      prohibited: ["account_transfer", "balance_modification", "speculative_balance"],
    },
  },
  health: {
    id: "health",
    title: "ICU Admission Workflow",
    accent: "#059669",
    gradient: "linear-gradient(135deg, #047857, #059669)",
    badge: "HEALTHCARE",
    endpoint: "/execute/icu_admission",
    fields: [
      { id: "patient_id", label: "Patient ID",      placeholder: "e.g. P-00789",         required: true,  type: "text" },
      { id: "ward",       label: "Ward",             placeholder: "Select ward",           required: true,  type: "select", options: ["ICU","HDU","CCU","NICU","Surgical ICU"] },
      { id: "team",       label: "Assigned Team",   placeholder: "Select team",           required: true,  type: "select", options: ["Team A","Team B","Team C","On-Call"] },
      { id: "notes",      label: "Clinical Notes",  placeholder: "e.g. ventilator support", required: false, type: "text" },
    ],
    intent: {
      scope: "icu_admission",
      prohibited: ["non_team_assignment", "ward_transfer_without_auth", "unauthorized_procedure"],
    },
  },
  legal: {
    id: "legal",
    title: "Legal Document Review Workflow",
    accent: "#7c3aed",
    gradient: "linear-gradient(135deg, #6d28d9, #7c3aed)",
    badge: "LEGAL",
    endpoint: "/execute/legal_review",
    fields: [
      { id: "document_ref",  label: "Document Ref",   placeholder: "e.g. CONTRACT-2026-001",  required: true,  type: "text" },
      { id: "jurisdiction",  label: "Jurisdiction",   placeholder: "Select",                  required: true,  type: "select", options: ["US (Federal)","UK (Companies Act)","EU (GDPR)","Singapore (PDPA)","Australia (Privacy Act)"] },
      { id: "doc_type",      label: "Document Type",  placeholder: "Select",                  required: false, type: "select", options: ["Contract","NDA","Terms of Service","Employment Agreement"] },
      { id: "document_text", label: "Document Text",  placeholder: "Paste document text here…", required: true, type: "textarea" },
    ],
    intent: {
      scope: "legal_extraction_only",
      prohibited: ["speculation", "legal_advice", "personal_liability_claims"],
    },
  },
};

// ── PLAYGROUND DEFAULT CODE ────────────────────────────────────────────────
export const DEFAULT_OL_CODE = `// O-Lang — Bank Balance Workflow
// Try editing this and clicking Run ↓

workflow bank_balance_v1 {

  @governance {
    allowed_resolvers: [
      "@o-lang/bank-lookup",
      "@o-lang/llm-groq"
    ]
    prohibited_actions: [
      "account_transfer",
      "balance_modification"
    ]
    audit: true
  }

  step lookup = @o-lang/bank-lookup({
    customer_id: $input.customer_id
  })

  step respond = @o-lang/llm-groq({
    context:       $lookup.balance,
    question:      $input.question,
    output_schema: "balance_only"
  })

}
`;