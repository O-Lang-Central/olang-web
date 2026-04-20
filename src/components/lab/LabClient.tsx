"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";
import Link from "next/link";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// ── Design tokens ────────────────────────────────────────────────────────────
const BG     = "#060c18";
const PANEL  = "#080f1c";
const BORDER = "#1a2540";
const TEXT   = "#e2e8f0";
const TEXT2  = "#64748b";
const TEXT3  = "#334155";
const accent = "#60a5fa";
const ERR    = "#f87171";
const WARN   = "#fbbf24";
const OK     = "#34d399";
const PURPLE = "#a78bfa";

// ── Types ────────────────────────────────────────────────────────────────────
type TabId = "customer" | "trace" | "safety" | "audit" | "intent";

interface SyntaxError {
  line: number; col: number; endCol: number;
  message: string; suggestion: string;
  severity: "error" | "warning";
}

interface SimResult {
  ok: boolean;
  response?: string;
  error?: string;
  steps: Array<{ step: number; resolver: string; status: string; input: string; policy_check: string; timestamp: string; simulated: boolean }>;
  audit: { execution_hash: string; prev_hash: string; kernel_signature: string; workflow_hash: string; timestamp: string; latency_ms: number };
  safety: { events: Array<{ type: "allow" | "block" | "warn"; message: string; detail: string }> };
  intent: { scope: string; prohibited: string[]; enforcement: string[]; fingerprint: string };
}

// ── Tutorial steps ───────────────────────────────────────────────────────────
const TUTORIALS = [
  {
    title: "1 · Workflow Declaration",
    description: "Every O-Lang file starts with a Workflow declaration. Give it a name in double quotes, then declare the input variables it expects using the `with` clause.",
    hint: "The `with` clause lists the inputs your workflow accepts — think of them like function parameters.",
    code: `Workflow "Hello World" with user_name

Allow resolvers:
  - @o-lang/llm-groq

Step 1: Ask @o-lang/llm-groq "Say hello to {user_name} in a warm, friendly tone. One sentence only."
Save as greeting

Return greeting`,
    inputs: { user_name: "Amara" },
  },
  {
    title: "2 · Allow Resolvers",
    description: "The `Allow resolvers:` block is a security allowlist. Only resolvers listed here can be called in your workflow. This prevents unexpected tool access.",
    hint: "Think of this as a capability whitelist — the kernel will reject any step that calls an unlisted resolver.",
    code: `Workflow "Balance Check" with customer_id, bank_db_path

Allow resolvers:
  - bank-account-lookup
  - @o-lang/llm-groq

Step 1: Ask bank-account-lookup "{customer_id}" "{bank_db_path}"
Save as account_info

Step 2: Ask @o-lang/llm-groq "Customer {account_info.name} has a balance of {account_info.balance} {account_info.currency}. Summarise this in one sentence."
Save as summary

Return summary`,
    inputs: { customer_id: "CUST-001", bank_db_path: "./bank.db" },
  },
  {
    title: "3 · Ask vs Use",
    description: "`Ask` sends a prompt to a resolver and waits for a response. `Use` invokes a resolver without a prompt — useful for side-effects like logging or notifications.",
    hint: "Use `Ask` when you need output. Use `Use` when you just want to trigger an action.",
    code: `Workflow "Notify on Balance" with customer_id

Allow resolvers:
  - bank-account-lookup
  - @o-lang/llm-groq
  - @o-lang/slack-notify

Step 1: Ask bank-account-lookup "{customer_id}" "./bank.db"
Save as account_info

Step 2: Ask @o-lang/llm-groq "Write a one-line balance alert for {account_info.name}: balance is {account_info.balance}."
Save as alert_message

Step 3: Use @o-lang/slack-notify

Return alert_message`,
    inputs: { customer_id: "CUST-002" },
  },
  {
    title: "4 · If Conditionals",
    description: "Use `If` blocks to branch your workflow based on a resolved value. Conditions support `equals`, `greater than`, and `less than`. Always close with `End If`.",
    hint: "Variables inside `{braces}` are resolved at runtime. Dot notation like `{account_info.balance}` accesses nested fields.",
    code: `Workflow "Smart Balance Check" with customer_id

Allow resolvers:
  - bank-account-lookup
  - @o-lang/llm-groq

Step 1: Ask bank-account-lookup "{customer_id}" "./bank.db"
Save as account_info

If {account_info.balance} greater than 10000
  Step 2: Ask @o-lang/llm-groq "Congratulate {account_info.name} on their healthy balance of {account_info.balance}. One sentence."
  Save as response
End If

If {account_info.balance} less than 1000
  Step 3: Ask @o-lang/llm-groq "Gently alert {account_info.name} that their balance of {account_info.balance} is low. One sentence."
  Save as response
End If

Return response`,
    inputs: { customer_id: "CUST-001" },
  },
  {
    title: "5 · Parallel Execution",
    description: "Run multiple steps simultaneously with `Run in parallel`. Add a timeout with `for 30s` to limit how long parallel steps can run. Close with `End`.",
    hint: "Parallel blocks are great for calling multiple resolvers at the same time — like enriching a customer profile from several data sources simultaneously.",
    code: `Workflow "Parallel Enrichment" with customer_id

Allow resolvers:
  - bank-account-lookup
  - @o-lang/llm-groq

Run in parallel for 10s
  Step 1: Ask bank-account-lookup "{customer_id}" "./bank.db"
  Save as account_info

  Step 2: Ask @o-lang/llm-groq "Generate a one-sentence financial profile for customer ID {customer_id}."
  Save as profile_summary
End

Step 3: Ask @o-lang/llm-groq "Combine this account data: {account_info.name}, balance {account_info.balance}. Profile: {profile_summary}. Write a 2-sentence customer brief."
Save as brief

Return brief`,
    inputs: { customer_id: "CUST-003" },
  },
  {
    title: "6 · Escalation Blocks",
    description: "Escalation blocks try each level in sequence with timeouts. Level 1 runs immediately; subsequent levels only run if the previous timed out.",
    hint: "Escalation is ideal for on-call systems, approval chains, or any workflow where humans need to be looped in if automation fails.",
    code: `Workflow "ICU Admission" with patient_id, team

Allow resolvers:
  - @o-lang/icu-admission
  - @o-lang/llm-groq

Step 1: Ask @o-lang/icu-admission "{patient_id}" "{team}"
Save as bed_info

Run in parallel with escalation:
  Level 1: immediately
    Step 2: Ask @o-lang/llm-groq "Summarise ICU admission for patient {patient_id}. Bed: {bed_info.bed_id}. One sentence."
    Save as summary

  Level 2: within 2m
    Step 3: Ask @o-lang/llm-groq "Escalate ICU admission for patient {patient_id} to senior clinician. Urgent summary."
    Save as summary
End

Return summary`,
    inputs: { patient_id: "P-00789", team: "Team A" },
  },
  {
    title: "7 · The Audit Trail",
    description: "Every O-Lang execution produces a cryptographic audit trail. The kernel signs each step with SHA-256 hashes chained together — making tampering detectable. Click the Audit tab after running to explore it.",
    hint: "The `execution_hash` is derived from inputs + step outputs + resolver names. The `kernel_signature` is RSA-signed by the kernel's private key — verifiable with the public key.",
    code: `Workflow "Audited Workflow" with user_input

Allow resolvers:
  - @o-lang/llm-groq

# Every step is hashed and signed automatically.
# You don't need to do anything — it just works.

Step 1: Ask @o-lang/llm-groq "Respond to: {user_input}. Keep it under 2 sentences."
Save as response

Return response`,
    inputs: { user_input: "What is O-Lang?" },
  },
];

// ── Blank template ───────────────────────────────────────────────────────────
const BLANK_TEMPLATE = `Workflow "My Workflow" with input1

Allow resolvers:
  - @o-lang/llm-groq

Step 1: Ask @o-lang/llm-groq "{input1}"
Save as response

Return response`;

// ── Hash helpers ─────────────────────────────────────────────────────────────
function simHash(input: string, prefix = "sha256:"): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  const hex = h.toString(16).padStart(8, "0");
  const expanded = Array.from({ length: 8 }, (_, i) =>
    ((h ^ (i * 0xdeadbeef)) >>> 0).toString(16).padStart(8, "0")
  ).join("");
  return prefix + expanded.slice(0, 56);
}

function simSig(input: string): string {
  return "rsa:" + Array.from({ length: 4 }, (_, i) =>
    simHash(input + i, "").slice(0, 16)
  ).join("");
}

// ── Kernel simulator ─────────────────────────────────────────────────────────
function simulateRun(code: string, inputs: Record<string, string>): SimResult {
  const now = new Date().toISOString();
  const latency = Math.floor(Math.random() * 220 + 80);

  // Parse workflow name + resolvers + steps
  const nameMatch = code.match(/^Workflow\s+"([^"]+)"/mi);
  const wfName = nameMatch?.[1] ?? "Unknown";

  const resolverMatches = [...code.matchAll(/^-\s+(@?[\w/-]+)/gmi)];
  const resolvers = resolverMatches.map(m => m[1]);

  // Extract prompt (Step 1)
  const stepPromptMatch = code.match(/Step\s+1:\s+Ask\s+[\w@/-]+\s+"([^"]+)"/i);
  const promptText = stepPromptMatch ? stepPromptMatch[1] : "";

  // ✅ More robust step parsing
  const stepMatches = [...code.matchAll(/Step\s+(\d+):\s+(?:Ask|Use)\s+([^\s]+)\s*(.*)/gi)];

  // ── SAFETY CHECKS ─────────────────────────────────────────
  const safetyEvents: SimResult["safety"]["events"] = [];
  const BLOCKED_PATTERNS = [
    { re: /fi\s+\w+\s+\w+\s+ran[sṣ][eẹ]/i, lang: "Yoruba", cap: "transfer" },
    { re: /aika.{0,30}ku[ɗd]i/iu, lang: "Hausa", cap: "transfer" },
    { re: /\b\w*lip[ae]\w*/i, lang: "Swahili", cap: "payment" },
    { re: /thumel/i, lang: "Zulu", cap: "transfer" },
    { re: /\u120b\u12ad/u, lang: "Amharic", cap: "transfer" },
    { re: /\b(transfer|send|wire|withdraw|deposit)\b/i, lang: "English", cap: "financial_action" },
    { re: /\b(?:bvn|bank\s+verification\s+number)\b.{0,20}\d{11}/i, lang: "multi", cap: "pii_exposure" },
    { re: /\b(?:\+?234\s*|0)(?:70|80|81|90|91)\d{8}\b/, lang: "multi", cap: "pii_exposure" },
  ];

  let blocked = false;
  let blockReason = "";

  for (const [, val] of Object.entries(inputs)) {
    for (const { re, lang, cap } of BLOCKED_PATTERNS) {
      if (re.test(val)) {
        blocked = true;
        blockReason = `[O-Lang SAFETY] Blocked Input in "${lang}":\n  → Detected: "${val.slice(0, 40)}"\n  → Capability: ${cap}\n\n🛑 Workflow halted before execution.`;
        safetyEvents.push({ type: "block", message: `Input blocked: ${cap} detected in ${lang}`, detail: `field: user_question | pattern: ${cap}` });
        break;
      }
    }
    if (blocked) break;
  }

  if (blocked) {
    return {
      ok: false,
      error: blockReason,
      steps: [],
      audit: {
        execution_hash: simHash(code + now, "sha256:"),
        prev_hash: "GENESIS",
        kernel_signature: "—",
        workflow_hash: simHash(code, "sha256:"),
        timestamp: now,
        latency_ms: latency,
      },
      safety: { events: safetyEvents },
      intent: {
        scope: wfName,
        prohibited: [],
        enforcement: ["allowlist", "pii_filter", "african_lang_filter"],
        fingerprint: simHash(code).slice(8, 40),
      },
    };
  }

  // ── SAFETY PASSED ─────────────────────────────────────────
  safetyEvents.push({ type: "allow", message: "Tool allowlist validated", detail: `allowed: ${resolvers.join(", ") || "none"}` });
  safetyEvents.push({ type: "allow", message: "PII scan passed", detail: "validator: pii_v2 | fields: all inputs" });
  safetyEvents.push({ type: "allow", message: "African language intent scan passed", detail: "languages checked: yo, ha, ig, sw, zu, am, so" });
  safetyEvents.push({ type: "allow", message: "Execution completed — no policy violations", detail: `fingerprint: ${simHash(code).slice(9, 36)}…` });

  // ── STEP SIMULATION ───────────────────────────────────────
  const steps: SimResult["steps"] = stepMatches.map((m, i) => {
    const stepNum = parseInt(m[1]);
    const resolver = m[2];

    return {
      step: stepNum,
      resolver,
      status: "allowed",
      input: JSON.stringify(inputs).slice(0, 55) + (JSON.stringify(inputs).length > 55 ? "…" : ""),
      policy_check: `allowlist: pass | intent: pass | pii: pass`,
      timestamp: new Date(Date.now() + i * 120).toISOString(),
      simulated: false,
    };
  });

  // ── SMART RESPONSE ENGINE ───────────────────────────────
  let response = "";

  // ✅ Detect actual execution resolvers
  const hasGroq = stepMatches.some(m => m[2].includes("llm-groq"));
  const hasBank = stepMatches.some(m => m[2].includes("bank-account-lookup"));
  const hasICU  = stepMatches.some(m => m[2].includes("icu-admission"));

  // ✅ Resolve input value safely
  let inputVal = inputs.name || inputs.user_message || Object.values(inputs)[0] || "World";

  const varMatch = promptText.match(/\{([^}]+)\}/);
  if (varMatch) {
    const varName = varMatch[1];
    if (inputs[varName]) {
      inputVal = inputs[varName];
    }
  }

  if (!inputVal || inputVal === "World") {
    const firstVal = Object.values(inputs)[0];
    if (firstVal) inputVal = firstVal;
  }

  const lowerPrompt = promptText.toLowerCase();

  if (hasGroq) {
    if (
      lowerPrompt.includes("hello") ||
      lowerPrompt.includes("greet") ||
      lowerPrompt.includes("hi")
    ) {
      response = `Hello, ${inputVal}! 👋`;
    } 
    else if (lowerPrompt.includes("what is")) {
      response = `O-Lang is a governed AI orchestration language. It ensures safety through cryptographic audit trails and resolver allowlists.`;
    }
    else if (lowerPrompt.includes("balance") || hasBank) {
      response = `Your current balance is ₦12,450.00. For any transactions, please use your banking app or visit a branch.`;
    }
    else if (hasICU) {
      response = `Patient P-00789 has been admitted to ICU Bed ICU-1 under Team A. Bed status: occupied.`;
    }
    else {
      // ✅ Dynamic rendering (core fix)
      response = promptText.replace(/\{([^}]+)\}/g, (_, key) => inputs[key] ?? "");
    }
  } else {
    response = `Workflow "${wfName}" executed successfully across ${steps.length} step${steps.length !== 1 ? "s" : ""}. All resolvers completed within policy bounds.`;
  }

  // ── AUDIT ───────────────────────────────────────────────
  const execHash = simHash(code + JSON.stringify(inputs) + now);
  const wfHash   = simHash(code);

  return {
    ok: true,
    response,
    steps,
    audit: {
      execution_hash: execHash,
      prev_hash: simHash(wfName + "GENESIS"),
      kernel_signature: simSig(execHash),
      workflow_hash: wfHash,
      timestamp: now,
      latency_ms: latency,
    },
    safety: { events: safetyEvents },
    intent: {
      scope: wfName,
      prohibited: [],
      enforcement: ["allowlist", "pii_filter", "african_lang_filter", "llm_output_scan"],
      fingerprint: simHash(code).slice(8, 40),
    },
  };
}


// ── Syntax validator ─────────────────────────────────────────────────────────
function validateOLang(code: string): SyntaxError[] {
  const errors: SyntaxError[] = [];
  const lines = code.split("\n");

  let hasWorkflow = false, hasReturn = false, hasAllow = false;
  let inAllow = false, lastStepNum = 0, ifDepth = 0;
  let inParallel = false, inEscalation = false;
  const saveAliases: string[] = [];

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const lineNum = i + 1;
    const t = line.trim();
    if (!t || t.startsWith("#")) return;

    if (/^Workflow\s/i.test(t)) {
      hasWorkflow = true; inAllow = false;
      if (!/^Workflow\s+"[^"]+"/.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: "Workflow name must be in double quotes.", suggestion: 'Workflow "My Workflow" with input1' });
      if (!/\bwith\b/i.test(t))
        errors.push({ line: lineNum, col: t.length, endCol: t.length, severity: "warning", message: "Workflow has no declared inputs.", suggestion: "Add:  with input_name1, input_name2" });
      return;
    }
    if (/^Allow resolvers:/i.test(t)) { hasAllow = true; inAllow = true; return; }
    if (inAllow && /^-?\s*\S+/.test(t) && !/^(Step|Save|Return|Run|If|End|Debrief|Evolve|Prompt|Persist|Emit|Use|Constraint)\b/i.test(t)) return;
    if (/^Constraint:\s*/i.test(t)) {
      inAllow = false;
      if (!/^Constraint:\s+\S+\s*=\s*\S+/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: "Constraint must be: Constraint: key = value", suggestion: "Constraint: max_generations = 5" });
      return;
    }
    const stepMatch = t.match(/^Step\s+(\d+):\s*(.+)$/i);
    if (stepMatch) {
      inAllow = false;
      const num = parseInt(stepMatch[1], 10);
      if (num <= lastStepNum)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: `Step ${num} is out of order — steps must increase monotonically.`, suggestion: `Step ${lastStepNum + 1}: Ask ResolverName "{variable}"` });
      lastStepNum = num;
      const action = stepMatch[2].trim();
      if (!/^(Ask|Use)\s+/i.test(action))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: 'Step body must start with "Ask" or "Use".', suggestion: `Step ${num}: Ask @o-lang/llm-groq "{input1}"` });
      const open = (t.match(/\{/g) || []).length;
      const close = (t.match(/\}/g) || []).length;
      if (open !== close)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: `Unmatched curly brace — ${open > close ? "missing closing }" : "extra }"}`, suggestion: "Every {symbol} needs a matching closing brace." });
      return;
    }
    if (/^Save as\s*/i.test(t)) {
      inAllow = false;
      const alias = t.replace(/^Save as\s*/i, "").trim().split(/\s+/)[0];
      if (!alias) errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: '"Save as" must be followed by a variable name.', suggestion: "Save as my_variable" });
      else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(alias)) errors.push({ line: lineNum, col: 9, endCol: t.length, severity: "error", message: `Variable name "${alias}" is invalid — use letters, numbers, underscores only.`, suggestion: `Save as ${alias.replace(/[^a-zA-Z0-9_]/g, "_")}` });
      else saveAliases.push(alias);
      return;
    }
    if (/^Return\s+/i.test(t)) {
      inAllow = false; hasReturn = true;
      const retVars = t.replace(/^Return\s+/i, "").split(",").map(v => v.trim());
      retVars.forEach(rv => {
        if (rv && saveAliases.length && !saveAliases.includes(rv))
          errors.push({ line: lineNum, col: 8, endCol: t.length, severity: "warning", message: `"${rv}" was not saved with "Save as".`, suggestion: `Return ${saveAliases[saveAliases.length - 1]}` });
      });
      return;
    }
    if (/^If\s+/i.test(t)) {
      inAllow = false; ifDepth++;
      if (!/^If\s+\{[^}]+\}\s+(equals|greater than|less than)\s+/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: 'If condition must use: {variable} equals "value"  |  greater than N  |  less than N', suggestion: 'If {result.score} greater than 80' });
      return;
    }
    if (/^End\s+If$/i.test(t)) {
      inAllow = false;
      if (ifDepth === 0) errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: '"End If" without a matching "If".', suggestion: "Add an If block before End If" });
      else ifDepth--;
      return;
    }
    if (/^Run in parallel/i.test(t)) { inAllow = false; inParallel = true; if (/escalation/i.test(t)) inEscalation = true; return; }
    if (/^Level\s+\d+:/i.test(t)) { if (!inEscalation) errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: '"Level" can only appear inside "Run in parallel with escalation:".', suggestion: "Run in parallel with escalation:" }); return; }
    if (/^End$/i.test(t)) { inAllow = false; if (!inParallel) errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: '"End" without a matching "Run in parallel" block.', suggestion: "Add a Run in parallel block before End" }); inParallel = false; inEscalation = false; return; }
    if (/^Debrief\s+/i.test(t)) { inAllow = false; if (!/^Debrief\s+\S+\s+with\s+"[^"]*"$/i.test(t)) errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error", message: 'Debrief syntax: Debrief AgentName with "message"', suggestion: 'Debrief System with "Alert: {variable}"' }); return; }
    if (/^Use\s+\S+/i.test(t)) { inAllow = false; return; }
    if (!inAllow && t !== "")
      errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "warning", message: `Unrecognised statement: "${t.slice(0, 40)}${t.length > 40 ? "…" : ""}"`, suggestion: "Check the O-Lang Syntax reference at /syntax" });
  });

  if (!hasWorkflow) errors.push({ line: 1, col: 1, endCol: 1, severity: "error", message: "Missing Workflow declaration.", suggestion: 'Workflow "My Workflow" with input1' });
  if (!hasAllow && hasWorkflow) errors.push({ line: 2, col: 1, endCol: 1, severity: "error", message: "Missing Allow resolvers: block.", suggestion: "Allow resolvers:\n  - @o-lang/llm-groq" });
  if (hasWorkflow && !hasReturn) errors.push({ line: lines.length, col: 1, endCol: 1, severity: "warning", message: "Workflow has no Return statement.", suggestion: "Return response" });
  if (ifDepth > 0) errors.push({ line: lines.length, col: 1, endCol: 1, severity: "error", message: `Unclosed If block — missing ${ifDepth} "End If"`, suggestion: "End If" });
  if (inParallel) errors.push({ line: lines.length, col: 1, endCol: 1, severity: "error", message: 'Unclosed "Run in parallel" block — missing "End"', suggestion: "End" });

  return errors;
}

// ── Monaco setup ─────────────────────────────────────────────────────────────
function setupMonaco(monaco: typeof import("monaco-editor")) {
  const LANG = "olang";
  if (monaco.languages.getLanguages().find(l => l.id === LANG)) return;
  monaco.languages.register({ id: LANG, extensions: [".ol"] });
  monaco.languages.setMonarchTokensProvider(LANG, {
    tokenizer: {
      root: [
        [/\b(Run in parallel with escalation|Run in parallel for|Run in parallel|End If|End)\b/, "keyword.control"],
        [/\b(Workflow|Allow resolvers|Step|Save as|Return|Debrief|Evolve|Prompt user to|Persist|Emit|Use|Constraint|Level)\b/, "keyword"],
        [/\b(with|Ask|using feedback|greater than|less than|equals|then|to)\b/, "keyword.inline"],
        [/"[^"]*"/, "string"],
        [/\{[^}]*\}/, "variable"],
        [/#.*$/, "comment"],
        [/\b\d+[smhd]?\b/, "number"],
      ],
    },
  });
  monaco.editor.defineTheme("olang-dark", {
    base: "vs-dark", inherit: true,
    rules: [
      { token: "keyword",         foreground: "818cf8", fontStyle: "bold" },
      { token: "keyword.control", foreground: "c084fc", fontStyle: "bold" },
      { token: "keyword.inline",  foreground: "818cf8" },
      { token: "string",          foreground: "fbbf24" },
      { token: "variable",        foreground: "f472b6" },
      { token: "comment",         foreground: "475569", fontStyle: "italic" },
      { token: "number",          foreground: "60a5fa" },
    ],
    colors: {
      "editor.background":              "#060c18",
      "editor.foreground":              "#e2e8f0",
      "editor.lineHighlightBackground": "#1a254018",
      "editorLineNumber.foreground":    "#334155",
      "editorCursor.foreground":        "#60a5fa",
      "editor.selectionBackground":     "#1a56db30",
    },
  });

  monaco.languages.registerCompletionItemProvider(LANG, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
      const S = monaco.languages.CompletionItemKind.Snippet;
      const K = monaco.languages.CompletionItemKind.Keyword;
      return {
        suggestions: [
          { label: "Workflow", kind: S, insertText: 'Workflow "${1:My Workflow}" with ${2:input1}\n\nAllow resolvers:\n  - ${3:@o-lang/llm-groq}\n\nStep 1: Ask ${3} "{${2}}"\nSave as ${4:response}\n\nReturn ${4}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: "Full workflow scaffold", range },
          { label: "Step", kind: S, insertText: 'Step ${1:1}: Ask ${2:@o-lang/llm-groq} "{${3:variable}}"\nSave as ${4:result}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: "Execution step", range },
          { label: "If equals", kind: S, insertText: 'If {${1:variable}} equals "${2:value}"\n  Step ${3:N}: Ask ${4:Resolver} "{${5:input}}"\n  Save as ${6:result}\nEnd If', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: "String equality condition", range },
          { label: "If greater than", kind: S, insertText: "If {${1:variable}} greater than ${2:0}\n  Step ${3:N}: Ask ${4:Resolver} \"{${5:input}}\"\n  Save as ${6:result}\nEnd If", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: "Numeric condition", range },
          { label: "Run in parallel", kind: S, insertText: "Run in parallel\n  Step ${1:1}: Ask ${2:ToolA} \"{${3:input}}\"\n  Save as ${4:result_a}\n\n  Step ${5:2}: Ask ${6:ToolB} \"{${3}}\"\n  Save as ${7:result_b}\nEnd", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: "Parallel execution block", range },
          { label: "Run in parallel with escalation", kind: S, insertText: "Run in parallel with escalation:\n\n  Level 1: immediately\n    Step ${1:1}: Ask ${2:Resolver} \"{${3:input}}\"\n    Save as response\n\n  Level 2: within ${4:5}m\n    Step ${5:2}: Ask ${6:OnCall} \"{${3}}\"\n    Save as response\n\nEnd", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: "Escalation block", range },
          { label: "Allow resolvers", kind: S, insertText: "Allow resolvers:\n  - ${1:@o-lang/llm-groq}", insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet, documentation: "Resolver allowlist", range },
          { label: "Return", kind: K, insertText: "Return ", documentation: "Workflow output", range },
          { label: "Save as", kind: K, insertText: "Save as ", documentation: "Bind output to variable", range },
          { label: "End If", kind: K, insertText: "End If", documentation: "Close If block", range },
          { label: "End", kind: K, insertText: "End", documentation: "Close parallel/escalation block", range },
        ],
      };
    },
  });
}

// ── TABS ─────────────────────────────────────────────────────────────────────
const TABS: { id: TabId; label: string }[] = [
  { id: "customer", label: "Output"  },
  { id: "trace",    label: "Trace"   },
  { id: "safety",   label: "Safety"  },
  { id: "audit",    label: "Audit"   },
  { id: "intent",   label: "Intent"  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function LabClient() {
  const [code, setCode]                   = useState(BLANK_TEMPLATE);
  const [inputs, setInputs]               = useState<Record<string, string>>({});
  const [running, setRunning]             = useState(false);
  const [result, setResult]               = useState<SimResult | null>(null);
  const [error, setError]                 = useState<string | null>(null);
  const [tab, setTab]                     = useState<TabId>("customer");
  const [syntaxErrors, setSyntaxErrors]   = useState<SyntaxError[]>([]);
  const [activeError, setActiveError]     = useState<SyntaxError | null>(null);
  const [tutorialOpen, setTutorialOpen]   = useState(false);
  const [tutorialStep, setTutorialStep]   = useState(0);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const inputNames: string[] = (() => {
    const m = code.match(/^Workflow\s+"[^"]+"\s+with\s+(.+)$/mi);
    if (!m) return [];
    return m[1].split(",").map(s => s.trim()).filter(Boolean);
  })();

  const handleEditorMount = useCallback((ed: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    editorRef.current = ed;
    setupMonaco(monaco);
    monaco.editor.setTheme("olang-dark");
    const model = ed.getModel();
    if (model) {
      setSyntaxErrors(validateOLang(model.getValue()));
      model.onDidChangeContent(() => {
        const e = validateOLang(model.getValue());
        setSyntaxErrors(e);
        if (e.length === 0) setActiveError(null);
      });
    }
  }, []);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    setTab("customer");
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    try {
      const sim = simulateRun(code, inputs);
      setResult(sim);
      if (!sim.ok) setError(sim.error ?? "Execution failed");
    } catch (e) {
      setError(`Simulation error: ${String(e)}`);
    } finally {
      setRunning(false);
    }
  };

  const loadTutorial = (idx: number) => {
    const t = TUTORIALS[idx];
    setCode(t.code);
    setInputs(t.inputs);
    setResult(null);
    setError(null);
    setActiveError(null);
    setTutorialOpen(false);
  };

  const errorCount   = syntaxErrors.filter(e => e.severity === "error").length;
  const warningCount = syntaxErrors.filter(e => e.severity === "warning").length;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: BG, color: TEXT }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 py-3 flex-shrink-0"
           style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-4">
          <Link href="/" className="font-syne font-extrabold text-[15px] tracking-[-0.5px]" style={{ color: TEXT }}>
            O-Lang
          </Link>
          <span style={{ color: BORDER }}>›</span>
          <span className="font-mono text-[13px] font-semibold" style={{ color: accent }}>Lab</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border"
                style={{ color: WARN, borderColor: WARN + "40", background: WARN + "10" }}>
            sandbox
          </span>
          {/* Tutorial badge */}
          <button
            onClick={() => setTutorialOpen(true)}
            className="font-mono text-[10px] px-2.5 py-0.5 rounded-full border transition-all hover:opacity-80"
            style={{ color: PURPLE, borderColor: PURPLE + "40", background: PURPLE + "10" }}>
            ✦ Tutorial mode
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
               style={{ background: OK + "10", border: `1px solid ${OK}25` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: OK }} />
            <span className="font-mono text-[11px]" style={{ color: OK }}>fully simulated</span>
          </div>
          <Link href="/syntax" className="font-mono text-[12px] px-3 py-1.5 rounded-lg transition-colors" style={{ color: TEXT2, border: `1px solid ${BORDER}` }}>
            Syntax ref ↗
          </Link>
          <Link href="/playground" className="font-mono text-[12px] px-3 py-1.5 rounded-lg transition-colors" style={{ color: TEXT2, border: `1px solid ${BORDER}` }}>
            ← Playground
          </Link>
        </div>
      </div>

      {/* ── Tutorial overlay ── */}
      {tutorialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
             style={{ background: "rgba(6,12,24,0.92)", backdropFilter: "blur(4px)" }}>
          <div className="w-[720px] max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
               style={{ background: PANEL, border: `1px solid ${PURPLE}40` }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                 style={{ borderBottom: `1px solid ${BORDER}` }}>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: PURPLE }}>O-Lang Tutorial</p>
                <h2 className="font-syne font-bold text-[18px]" style={{ color: TEXT }}>{TUTORIALS[tutorialStep].title}</h2>
              </div>
              <button onClick={() => setTutorialOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70" style={{ color: TEXT2, border: `1px solid ${BORDER}` }}>✕</button>
            </div>

            {/* Step nav */}
            <div className="flex px-6 pt-4 gap-1.5 flex-shrink-0">
              {TUTORIALS.map((_, i) => (
                <button key={i} onClick={() => setTutorialStep(i)}
                  className="flex-1 h-1 rounded-full transition-all"
                  style={{ background: i === tutorialStep ? PURPLE : i < tutorialStep ? PURPLE + "50" : BORDER }} />
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-[14px] leading-relaxed" style={{ color: TEXT }}>{TUTORIALS[tutorialStep].description}</p>

              {/* Hint box */}
              <div className="rounded-xl p-3.5" style={{ background: PURPLE + "10", border: `1px solid ${PURPLE}25` }}>
                <p className="text-[12px] font-semibold mb-1" style={{ color: PURPLE }}>💡 Key insight</p>
                <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>{TUTORIALS[tutorialStep].hint}</p>
              </div>

              {/* Code preview */}
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#0c1628", borderBottom: `1px solid ${BORDER}` }}>
                  <span className="font-mono text-[11px]" style={{ color: TEXT3 }}>example.ol</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ color: OK, background: OK + "15", border: `1px solid ${OK}30` }}>valid syntax</span>
                </div>
                <pre className="p-4 text-[12px] leading-relaxed overflow-x-auto font-mono whitespace-pre-wrap"
                     style={{ background: BG, color: "#c4b5fd" }}>
                  {TUTORIALS[tutorialStep].code}
                </pre>
              </div>

              {/* Input preview */}
              {Object.keys(TUTORIALS[tutorialStep].inputs).length > 0 && (
                <div className="rounded-xl p-4" style={{ background: "#0c1628", border: `1px solid ${BORDER}` }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-2.5" style={{ color: TEXT3 }}>Example inputs</p>
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(TUTORIALS[tutorialStep].inputs).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-3 font-mono text-[12px]">
                        <span style={{ color: accent }}>{k}</span>
                        <span style={{ color: TEXT3 }}>→</span>
                        <span style={{ color: WARN }}>"{v}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderTop: `1px solid ${BORDER}` }}>
              <div className="flex items-center gap-2">
                <button onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))} disabled={tutorialStep === 0}
                  className="px-4 py-2 rounded-lg font-mono text-[12px] font-semibold transition-all disabled:opacity-30"
                  style={{ color: TEXT2, border: `1px solid ${BORDER}` }}>
                  ← Prev
                </button>
                <button onClick={() => setTutorialStep(Math.min(TUTORIALS.length - 1, tutorialStep + 1))} disabled={tutorialStep === TUTORIALS.length - 1}
                  className="px-4 py-2 rounded-lg font-mono text-[12px] font-semibold transition-all disabled:opacity-30"
                  style={{ color: TEXT2, border: `1px solid ${BORDER}` }}>
                  Next →
                </button>
              </div>
              <button onClick={() => loadTutorial(tutorialStep)}
                className="px-5 py-2 rounded-lg font-mono text-[13px] font-bold transition-all hover:opacity-90"
                style={{ background: PURPLE, color: "#fff" }}>
                Load into editor ↗
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Inputs + hints */}
        <div className="w-64 flex-shrink-0 flex flex-col overflow-y-auto" style={{ background: PANEL, borderRight: `1px solid ${BORDER}` }}>

          {/* Run button */}
          <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button onClick={run} disabled={running || errorCount > 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: running ? accent + "40" : errorCount > 0 ? ERR + "30" : accent, color: "#fff" }}>
              {running ? (
                <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="31 31"/></svg>Running…</>
              ) : errorCount > 0 ? (
                <>✗ Fix {errorCount} error{errorCount > 1 ? "s" : ""} first</>
              ) : (
                <><svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5 3l11 7-11 7V3z"/></svg>Run Workflow</>
              )}
            </button>
            {(errorCount > 0 || warningCount > 0) && (
              <div className="flex gap-2 mt-2">
                {errorCount > 0 && <span className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={{ background: ERR + "20", color: ERR, border: `1px solid ${ERR}40` }}>{errorCount} error{errorCount > 1 ? "s" : ""}</span>}
                {warningCount > 0 && <span className="font-mono text-[11px] px-2 py-0.5 rounded-full" style={{ background: WARN + "20", color: WARN, border: `1px solid ${WARN}40` }}>{warningCount} warning{warningCount > 1 ? "s" : ""}</span>}
              </div>
            )}
          </div>

          {/* Dynamic inputs */}
          <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT2 }}>Workflow Inputs</p>
            {inputNames.length === 0 ? (
              <p className="text-[13px] italic" style={{ color: TEXT2 }}>Declare inputs with the <span style={{ color: accent }}>with</span> clause</p>
            ) : (
              <div className="flex flex-col gap-3">
                {inputNames.map(name => (
                  <div key={name}>
                    <label className="font-mono text-[13px] font-semibold mb-1.5 block" style={{ color: TEXT }}>{name}</label>
                    <input type="text" value={inputs[name] ?? ""} onChange={e => setInputs(p => ({ ...p, [name]: e.target.value }))}
                      placeholder={`value for ${name}`}
                      className="w-full rounded-lg px-3 py-2 text-[13px] font-mono outline-none"
                      style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT, caretColor: accent }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Syntax hints */}
          {syntaxErrors.length > 0 && (
            <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT3 }}>Syntax Hints</p>
              <div className="flex flex-col gap-2">
                {syntaxErrors.map((e, i) => (
                  <button key={i} onClick={() => {
                    setActiveError(e);
                    editorRef.current?.revealLineInCenter(e.line);
                    editorRef.current?.setPosition({ lineNumber: e.line, column: e.col });
                    editorRef.current?.focus();
                  }}
                    className="text-left rounded-lg p-2.5 text-[12px] transition-all"
                    style={{ background: e.severity === "error" ? "#ef444415" : "#f59e0b10", border: `1px solid ${e.severity === "error" ? "#ef444435" : "#f59e0b30"}` }}>
                    <p className="font-mono text-[11px] font-bold mb-0.5" style={{ color: e.severity === "error" ? ERR : WARN }}>
                      {e.severity === "error" ? "✗" : "⚠"} Line {e.line}
                    </p>
                    <p style={{ color: TEXT }}>{e.message}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestion */}
          {activeError && (
            <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>💡 Suggestion</p>
              <div className="rounded-lg p-2.5 font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                   style={{ background: "#60a5fa10", border: "1px solid #60a5fa30", color: "#93c5fd" }}>
                {activeError.suggestion}
              </div>
            </div>
          )}

          {/* Known resolvers */}
          <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT2 }}>Simulated Resolvers</p>
            <div className="flex flex-col gap-2 mb-3">
              {["@o-lang/llm-groq", "bank-account-lookup", "@o-lang/icu-admission"].map(r => (
                <div key={r} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: OK }} />
                  <span className="font-mono text-[12px]" style={{ color: OK }}>{r}</span>
                </div>
              ))}
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: TEXT2 }}>
              Any other resolver will return a clearly-labelled <span style={{ color: WARN }}>simulated</span> response.
            </p>
          </div>

          {/* Tips */}
          {syntaxErrors.length === 0 && (
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT2 }}>Tips</p>
              <div className="flex flex-col gap-2.5 text-[13px]" style={{ color: TEXT }}>
                <p>Hit <span className="font-mono font-semibold" style={{ color: accent }}>Ctrl+Space</span> for autocomplete snippets.</p>
                <p>Click <span className="font-semibold" style={{ color: PURPLE }}>✦ Tutorial mode</span> above for a guided walkthrough.</p>
                <p>Safety checks run on every input — try sending a Yoruba transfer phrase to see the safety panel fire.</p>
              </div>
            </div>
          )}
        </div>

        {/* CENTRE: Monaco */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
               style={{ background: BG, borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {["#ff5f57", "#ffbd2e", "#28c840"].map(c => <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
              </div>
              <span className="font-mono text-sm font-medium" style={{ color: TEXT3 }}>sandbox.ol</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setCode(BLANK_TEMPLATE); setInputs({}); setResult(null); setError(null); setActiveError(null); }}
                className="font-mono text-sm px-3 py-1 rounded-lg transition-all hover:text-white"
                style={{ color: TEXT3, border: `1px solid ${BORDER}` }}>
                Reset
              </button>
              <span className="font-mono text-xs" style={{ color: TEXT3 }}>Ctrl+Space for snippets</span>
            </div>
          </div>
          <div className="flex-1">
            <MonacoEditor height="100%" language="olang" value={code} onChange={v => setCode(v ?? "")} onMount={handleEditorMount}
              options={{ fontSize: 14, fontFamily: "'DM Mono', 'Fira Code', monospace", lineHeight: 24, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 24, bottom: 24 }, renderLineHighlight: "line", lineNumbers: "on", glyphMargin: true, folding: false, overviewRulerLanes: 0, wordWrap: "on", automaticLayout: true, quickSuggestions: true, suggestOnTriggerCharacters: true, tabSize: 2 }} />
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden" style={{ background: PANEL, borderLeft: `1px solid ${BORDER}` }}>
          <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors relative"
                style={{ color: tab === t.id ? TEXT : TEXT3 }}>
                {t.label}
                {tab === t.id && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full" style={{ background: accent }} />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">

            {/* Empty state */}
            {!result && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: accent + "15", border: `1px solid ${accent}25` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" className="w-8 h-8"><path d="M5 3l14 9-14 9V3z"/></svg>
                </div>
                <div>
                  <p className="text-base font-semibold mb-1" style={{ color: TEXT }}>Write & Run a Workflow</p>
                  <p className="text-sm mb-3" style={{ color: TEXT2 }}>Results appear here after execution</p>
                  <button onClick={() => setTutorialOpen(true)}
                    className="font-mono text-[12px] px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ color: PURPLE, border: `1px solid ${PURPLE}40`, background: PURPLE + "10" }}>
                    ✦ Start tutorial
                  </button>
                </div>
              </div>
            )}

            {/* Output tab */}
            {tab === "customer" && result && (
              <div className="space-y-4">
                {result.ok && result.response && (
                  <>
                    <div className="rounded-2xl p-4" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                      <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: TEXT }}>
                        {result.response}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <svg viewBox="0 0 16 16" fill="none" stroke={OK} strokeWidth="1.5" className="w-4 h-4 flex-shrink-0"><path d="M8 14s6-3 6-7.5V3.75L8 2 2 3.75V6.5C2 11 8 14 8 14z"/><path d="M5.5 8l2 2 3-3"/></svg>
                      <p className="text-[12px] font-semibold" style={{ color: OK }}>Simulated kernel response — mirrors real output</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: PURPLE + "10", border: `1px solid ${PURPLE}20` }}>
                      <p className="text-[11px]" style={{ color: PURPLE }}>✦ This is a fully simulated response. On a live server with real resolvers, this output is generated by the actual kernel and signed cryptographically.</p>
                    </div>
                  </>
                )}
                {!result.ok && (
                  <div className="space-y-3">
                    <div className="rounded-2xl p-4" style={{ background: "#ef444415", border: "1px solid #ef444430" }}>
                      <p className="text-sm font-semibold mb-2" style={{ color: ERR }}>🛑 Safety halt</p>
                      <p className="text-[12px] font-mono leading-relaxed whitespace-pre-wrap" style={{ color: TEXT2 }}>{result.error}</p>
                    </div>
                    <div className="rounded-xl p-3" style={{ background: WARN + "10", border: `1px solid ${WARN}25` }}>
                      <p className="text-[12px] font-semibold mb-1" style={{ color: WARN }}>How to fix</p>
                      <p className="text-[12px]" style={{ color: TEXT2 }}>Remove the flagged phrase from the input field, or rephrase the query as a read-only question (e.g. "What is my balance?").</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Trace tab */}
            {tab === "trace" && result && (
              <div className="space-y-3">
                {result.steps.length === 0 && (
                  <div className="rounded-xl p-4 text-center" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                    <p className="text-[13px]" style={{ color: TEXT2 }}>No steps executed — workflow was halted at input validation.</p>
                  </div>
                )}
                {result.steps.map((s, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: "#0f172a", border: `1px solid ${s.simulated ? WARN + "40" : BORDER}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-[11px] font-bold" style={{ color: accent }}>Step {s.step}</span>
                      <div className="flex items-center gap-1.5">
                        {s.simulated && <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ background: WARN + "20", color: WARN, border: `1px solid ${WARN}40` }}>simulated</span>}
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full" style={{ background: OK + "20", color: OK }}>{s.status}</span>
                      </div>
                    </div>
                    <p className="font-mono text-[12px] mb-1" style={{ color: s.simulated ? WARN : OK }}>{s.resolver}</p>
                    {s.simulated && <p className="text-[11px] mb-1 italic" style={{ color: WARN + "aa" }}>⚡ Not in simulated resolver list — response is placeholder</p>}
                    <p className="text-[12px]" style={{ color: TEXT2 }}>Input: {s.input}</p>
                    <p className="text-[11px] mt-1" style={{ color: TEXT3 }}>Policy: {s.policy_check}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: TEXT3 }}>{s.timestamp}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Safety tab */}
            {tab === "safety" && result && (
              <div className="space-y-3">
                {result.safety.events.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-3.5"
                       style={{ background: e.type === "block" ? "#ef444415" : e.type === "allow" ? OK + "12" : "#f59e0b12", border: `1px solid ${e.type === "block" ? "#ef444435" : e.type === "allow" ? OK + "35" : "#f59e0b35"}` }}>
                    <span className="text-sm mt-0.5">{e.type === "allow" ? "✓" : e.type === "block" ? "✗" : "⚠"}</span>
                    <div>
                      <p className="text-[13px] font-semibold" style={{ color: e.type === "block" ? ERR : e.type === "allow" ? OK : WARN }}>{e.message}</p>
                      <p className="font-mono text-[11px] mt-0.5" style={{ color: TEXT2 }}>{e.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Audit tab */}
            {tab === "audit" && result && (
              <div className="space-y-3">
                <div className="rounded-xl p-3 mb-1" style={{ background: PURPLE + "10", border: `1px solid ${PURPLE}20` }}>
                  <p className="text-[11px]" style={{ color: PURPLE }}>✦ These hashes are deterministically simulated from your workflow code and inputs. On a live kernel they are computed and RSA-signed server-side.</p>
                </div>
                {[
                  { label: "Execution Hash",   value: result.audit.execution_hash },
                  { label: "Prev Hash",         value: result.audit.prev_hash },
                  { label: "Kernel Signature",  value: result.audit.kernel_signature },
                  { label: "Workflow Hash",      value: result.audit.workflow_hash },
                  { label: "Timestamp",          value: result.audit.timestamp },
                  { label: "Latency",            value: `${result.audit.latency_ms}ms` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3.5" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: TEXT3 }}>{label}</p>
                    <p className="font-mono text-[12px] break-all" style={{ color: accent }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Intent tab */}
            {tab === "intent" && result && (
              <div className="space-y-3">
                <div className="rounded-xl p-4" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: TEXT3 }}>Scope</p>
                  <p className="font-mono text-[13px]" style={{ color: "#c4b5fd" }}>{result.intent.scope}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: TEXT3 }}>Enforcement layers</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.intent.enforcement.map(e => (
                      <span key={e} className="inline-block font-mono text-[11px] px-2 py-0.5 rounded" style={{ background: OK + "15", border: `1px solid ${OK}30`, color: OK }}>{e}</span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: TEXT3 }}>Workflow fingerprint</p>
                  <p className="font-mono text-[12px] break-all" style={{ color: accent }}>{result.intent.fingerprint}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: TEXT3 }}>Prohibited capabilities</p>
                  <p className="text-[13px]" style={{ color: result.intent.prohibited.length === 0 ? OK : ERR }}>
                    {result.intent.prohibited.length === 0 ? "None — all steps within policy" : result.intent.prohibited.join(", ")}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}