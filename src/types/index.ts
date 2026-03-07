// ── RESOLVER REGISTRY ──────────────────────────────────────────────────────
export type ResolverScope = "finance" | "health" | "legal" | "llm" | "utils";

export interface Resolver {
  name: string;          // e.g. "@o-lang/bank-lookup"
  scope: ResolverScope;
  version: string;
  description: string;
  tags: string[];
  verified: boolean;
  status?: "live" | "planned";
  color: string;         // accent hex
  bgColor: string;       // gradient start hex
  initials: string;      // 2-char logo
  downloads?: number;
  author?: string;
  repoUrl?: string;
}

// ── WORKFLOW EXECUTION ─────────────────────────────────────────────────────
export interface KernelPayload {
  [key: string]: unknown;
  __kernel: {
    workflow_id: string;
    runtime_version: string;
    gov_profile_hash: string | null;
  };
  __verified_intent?: {
    scope?: string;
    prohibited_actions?: string[];
    extractOnly?: string[];
    prohibited_output?: string[];
  };
}

export interface ExecutionStep {
  step: number;
  resolver: string;
  status: "allowed" | "blocked" | "warn";
  input: string;
  policy_check: string;
  timestamp: string;
  output?: string;
}

export interface ExecutionResult {
  ok: boolean;
  response?: string;
  error?: string;
  violation?: {
    action: string;
    triggered: string;
    policy: string;
    stage: string;
  };
  steps: ExecutionStep[];
  audit: {
    execution_hash: string;
    prev_hash: string;
    kernel_signature: string;
    workflow_hash: string;
    timestamp: string;
    latency_ms: number;
  };
  safety: {
    events: Array<{
      type: "allow" | "block" | "warn";
      message: string;
      detail: string;
      timestamp: string;
    }>;
  };
  intent: {
    scope: string;
    prohibited: string[];
    enforcement: string[];
    fingerprint: string;
  };
}

// ── NAV ────────────────────────────────────────────────────────────────────
export interface NavLink {
  label: string;
  href: string;
}

// ── DOMAIN ─────────────────────────────────────────────────────────────────
export type WorkflowDomain = "finance" | "health" | "legal";

export interface DomainConfig {
  id: WorkflowDomain;
  title: string;
  accent: string;
  gradient: string;
  badge: string;
  endpoint: string;
  fields: Array<{
    id: string;
    label: string;
    placeholder: string;
    required: boolean;
    type: "text" | "select" | "textarea";
    options?: string[];
  }>;
  intent: {
    scope: string;
    prohibited: string[];
  };
}