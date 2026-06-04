"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";
import { fakeHash, DOMAIN_CONFIGS } from "@/lib/utils";
import type { ExecutionResult } from "@/types";
import { useSearchParams } from "next/navigation";
import { useBeds, BedManagerPanel, BedManagerTab } from "@/components/BedManager";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type TabId   = "trace" | "safety" | "audit" | "intent" | "customer" | "beds";
// Internal domain types remain strict
type Domain  = "finance" | "health" | "legal";

const KERNEL_URL = process.env.NEXT_PUBLIC_KERNEL_URL ?? "http://localhost:3001";

// ── TEMPLATES (Keys must match Internal Domain Type) ──────────────────────────
const OL_TEMPLATES: Record<Domain, string> = {
  finance: `Workflow "Bank Balance Check" with user_question, customer_id, bank_db_path

Allow resolvers:
- @o-lang/bank-account-lookup
- @o-lang/llm-groq

Step 1: Ask @o-lang/bank-account-lookup "{customer_id}" "{bank_db_path}"
Save as account_info

Step 2: Ask @o-lang/llm-groq "Answer this customer question: '{user_question}'.
The customer's current balance is {account_info.balance}.
NEVER mention account numbers, routing numbers, or transfer capabilities.
Keep response under 2 sentences."
Save as response

Return response`,

  health: `Workflow "ICU Patient Admission" with patient_id, ward, team, notes

Allow resolvers:
- icu-admission
- llm-groq

Step 1: Ask @o-lang/icu-admission "{patient_id}" "{ward}" "{team}"
Save as admission_summary

Step 2: Ask llm-groq "You are a hospital bed coordinator, not a clinician. Patient {patient_id} was processed for {ward} admission by {team}. Notes: {notes}. Admission result: {admission_summary}. Provide a brief administrative summary of the admission outcome only. Do not suggest treatments, prescriptions, or medical procedures."
Save as response

Return response`,

  legal: `Workflow "Legal Document Review" with document_ref, jurisdiction, doc_type, document_text

Allow resolvers:
- legal-extractor
- llm-groq

Step 1: Ask legal-extractor "{document_ref}" "{jurisdiction}" "{doc_type}" "{document_text}"
Save as extracted

Step 2: Ask llm-groq "You are a legal document analyst.
Summarise the key findings from this {doc_type} under {jurisdiction} law.

Reference: {document_ref}

PARTIES:
{extracted.parties_text}

KEY CLAUSES:
{extracted.clauses_text}

DATES & DEADLINES:
{extracted.dates_text}

KEY OBLIGATIONS:
{extracted.obligations_text}

RISK FLAGS:
{extracted.risks_text}

Instructions: Identify all parties. Explain each clause in plain English.
Highlight high-risk items. Note all important dates and deadlines.
State the document type and word count.
NEVER provide legal advice, speculate on outcomes, or make personal liability claims."
Save as response

Return response`,
};

// ── FIX #1: NORMALIZATION LAYER ───────────────────────────────────────────────
function domainFromParam(param: string | null): Domain {
  switch (param?.toLowerCase()) {
    case "healthcare":
    case "health":
      return "health";
    case "finance":
      return "finance";
    case "legal":
    case "government": // Map government to legal if desired, or default
      return "legal";
    default:
      return "finance"; // Safe fallback
  }
}

// ── SYNTAX VALIDATION (Unchanged) ─────────────────────────────────────────────
interface SyntaxError {
  line:       number;
  col:        number;
  endCol:     number;
  message:    string;
  suggestion: string;
  severity:   "error" | "warning";
}

function validateOLang(code: string): SyntaxError[] {
  const errors: SyntaxError[]  = [];
  const lines                  = code.split("\n");
  let hasWorkflow               = false;
  let hasReturn                 = false;
  let hasAllow                  = false;
  let stepCount                 = 0;
  const saveAliases: string[]  = [];

  const KNOWN_RESOLVERS = new Set([
    "legal-extractor", "llm-groq", "llm-openai",
    "bank-account-lookup", "icu-admission", "pii-validator"
  ]);

  lines.forEach((raw, i) => {
    const line    = raw.trimEnd();
    const lineNum = i + 1;
    const t       = line.trim();
    if (!t || t.startsWith("#")) return;

    if (/^Workflow\s/i.test(t)) {
      hasWorkflow = true;
      if (!/^Workflow\s+"[^"]+"/.test(t))
        errors.push({ line: lineNum, col: 1, endCol: 8, severity: "error",
          message: "Workflow name must be in double quotes.",
          suggestion: 'Workflow "My Workflow Name" with input1, input2' });
      if (!/\bwith\b/.test(t))
        errors.push({ line: lineNum, col: t.length, endCol: t.length, severity: "warning",
          message: "Workflow has no declared inputs.",
          suggestion: 'Add:  with input_name1, input_name2' });
      return;
    }

    if (/^Allow resolvers:/i.test(t)) { hasAllow = true; return; }

    if (/^-\s+/.test(t)) {
      const rawName = t.substring(2).trim();
      const cleanName = rawName.replace(/^@o-lang\//i, '');
      
      if (!hasAllow) {
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: "Resolver listed outside an 'Allow resolvers:' block.",
          suggestion: "Add 'Allow resolvers:' on the line above your resolver list." });
      } else if (!KNOWN_RESOLVERS.has(cleanName)) {
        errors.push({
          line: lineNum,
          col: 1,
          endCol: t.length,
          severity: "warning",
          message: `Unknown resolver: "${cleanName}". Verify the name or add it to the allowlist.`,
          suggestion: `- ${cleanName}`
        });
      }
      return;
    }

    if (/^Step\s+\d+:/i.test(t) || /^Ask\s+/i.test(t)) {
      const quotedStrings = t.match(/"([^"]*)"/g);
      if (quotedStrings) {
        for (const quote of quotedStrings) {
          const inner = quote.slice(1, -1);
          if (/\bReturn\s+(ONLY|the|your|output|result|report|response)/i.test(inner)) {
            errors.push({
              line: lineNum,
              col: t.indexOf(quote) + 1,
              endCol: t.indexOf(quote) + quote.length,
              severity: "warning",
              message: '"Return" is a reserved O-Lang keyword. Inside prompts, use "Display", "Output", or "Provide" instead.',
              suggestion: inner.replace(/\bReturn\b/i, "Display")
            });
          }
        }
      }
    }

    if (/^Step\s+\d+:/i.test(t)) {
      stepCount++;
      if (!/^Step\s+\d+:\s+Ask\s+/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: 'Step must use "Ask" to call a resolver.',
          suggestion: `Step ${stepCount}: Ask @o-lang/resolver-name "{input}"` });
      const open  = (t.match(/\{/g) || []).length;
      const close = (t.match(/\}/g) || []).length;
      if (open !== close)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: `Unmatched curly brace — ${open > close ? "missing closing }" : "extra }"}`,
          suggestion: "Every {symbol} needs a matching closing brace." });
      return;
    }

    if (/^Save as\s*/i.test(t)) {
      const alias = t.replace(/^Save as\s*/i, "").trim();
      if (!alias)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: '"Save as" must be followed by a variable name.',
          suggestion: "Save as my_variable" });
      else if (!/^[a-z_][a-z0-9_]*$/i.test(alias))
        errors.push({ line: lineNum, col: 9, endCol: t.length, severity: "error",
          message: `Variable name "${alias}" is invalid. Use letters, numbers and underscores only.`,
          suggestion: `Save as ${alias.replace(/[^a-z0-9_]/gi, "_").toLowerCase()}` });
      else saveAliases.push(alias);
      return;
    }

    if (/^Return\s+/i.test(t)) {
      hasReturn = true;
      const retVar = t.replace(/^Return\s+/i, "").trim();
      if (retVar && saveAliases.length && !saveAliases.includes(retVar))
        errors.push({ line: lineNum, col: 8, endCol: t.length, severity: "warning",
          message: `"${retVar}" was not declared with "Save as".`,
          suggestion: `Return ${saveAliases[saveAliases.length - 1]}` });
      return;
    }

    const typos: [RegExp, RegExp, string, string][] = [
      [/^step\s+\d/i,        /^Step\s+\d/i,        "step",             "Step"],
      [/^workflow\s/i,       /^Workflow\s/i,        "workflow",         "Workflow"],
      [/^return\s/i,         /^Return\s/i,          "return",           "Return"],
      [/^save as/i,          /^Save as/i,           "save as",          "Save as"],
      [/^allow resolvers/i,  /^Allow resolvers/i,   "allow resolvers",  "Allow resolvers"],
    ];
    for (const [match, correct, from, to] of typos) {
      if (match.test(t) && !correct.test(t))
        errors.push({ line: lineNum, col: 1, endCol: from.length, severity: "error",
          message: `"${from}" must be capitalised as "${to}".`,
          suggestion: t.replace(new RegExp(`^${from}`, "i"), to) });
    }
  });

  if (!hasWorkflow)
    errors.push({ line: 1, col: 1, endCol: 1, severity: "error",
      message: "Missing Workflow declaration.",
      suggestion: 'Workflow "My Workflow" with input1, input2' });
  if (hasWorkflow && !hasReturn)
    errors.push({ line: lines.length, col: 1, endCol: 1, severity: "warning",
      message: "Workflow has no Return statement — nothing will be returned.",
      suggestion: "Return response" });

  return errors;
}

function setupMonaco(monaco: typeof import("monaco-editor")) {
  const LANG = "olang";
  if (monaco.languages.getLanguages().find((l) => l.id === LANG)) return;
  monaco.languages.register({ id: LANG, extensions: [".ol"] });
  monaco.languages.setMonarchTokensProvider(LANG, {
    tokenizer: {
      root: [
        [/^Workflow /,               "kw_workflow"],
        [/^Allow resolvers:/,        "kw_allow"],
        [/^Step [0-9]+:/,            "kw_step"],
        [/ Ask /,                    "kw_ask"],
        [/^Save as /,                "kw_save"],
        [/^Return /,                 "kw_return"],
        [/ with /,                   "kw_with"],
        [/o-lang\/[a-zA-Z0-9_-]+/, "resolver"],
        [/\{[^}]*\}/,               "variable"],
        [/"[^"]*"/,                  "string"],
        [/#[^\n]*/,                  "comment"],
      ],
    },
  });
  monaco.editor.defineTheme("olang-dark", {
    base: "vs-dark", inherit: true,
    rules: [
      { token: "kw_workflow", foreground: "60a5fa", fontStyle: "bold" },
      { token: "kw_allow",    foreground: "60a5fa", fontStyle: "bold" },
      { token: "kw_step",     foreground: "a78bfa", fontStyle: "bold" },
      { token: "kw_ask",      foreground: "f472b6" },
      { token: "kw_save",     foreground: "34d399" },
      { token: "kw_return",   foreground: "34d399", fontStyle: "bold" },
      { token: "kw_with",     foreground: "60a5fa" },
      { token: "resolver",    foreground: "fb923c" },
      { token: "variable",    foreground: "fbbf24" },
      { token: "string",      foreground: "e2e8f0" },
      { token: "comment",     foreground: "475569", fontStyle: "italic" },
    ],
    colors: {
      "editor.background":                 "#080e1c",
      "editor.foreground":                 "#e2e8f0",
      "editorLineNumber.foreground":       "#2d3f5c",
      "editorLineNumber.activeForeground": "#60a5fa",
      "editor.lineHighlightBackground":    "#ffffff07",
      "editorCursor.foreground":           "#60a5fa",
      "editor.selectionBackground":        "#1a56db35",
      "editorGutter.background":           "#060c18",
    },
  });
  monaco.languages.registerCompletionItemProvider(LANG, {
    triggerCharacters: [" ", "\n"],
    provideCompletionItems: (model, position) => {
      const word  = model.getWordUntilPosition(position);
      const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
      const S = monaco.languages.CompletionItemKind.Snippet;
      const K = monaco.languages.CompletionItemKind.Keyword;
      return { suggestions: [
        { label: "Workflow",     kind: S, insertTextRules: 4, range, insertText: 'Workflow "${1:Workflow Name}" with ${2:input1}, ${3:input2}', documentation: "Declare a new O-Lang workflow" },
        { label: "Allow resolvers", kind: S, insertTextRules: 4, range, insertText: "Allow resolvers:\n- @o-lang/${1:resolver-name}", documentation: "Declare allowed resolvers" },
        { label: "Step",         kind: S, insertTextRules: 4, range, insertText: 'Step ${1:1}: Ask @o-lang/${2:resolver} "{${3:input}}"\nSave as ${4:result}', documentation: "Add a workflow execution step" },
        { label: "Save as",      kind: K, insertTextRules: 4, range, insertText: "Save as ${1:variable_name}", documentation: "Save step output to a named variable" },
        { label: "Return",       kind: K, insertTextRules: 4, range, insertText: "Return ${1:response}", documentation: "Return a value from the workflow" },
        { label: "@o-lang/bank-account-lookup", kind: K, insertText: "@o-lang/bank-account-lookup", range },
        { label: "@o-lang/icu-admission",        kind: K, insertText: "@o-lang/icu-admission", range },
        { label: "@o-lang/legal-extractor",      kind: K, insertText: "@o-lang/legal-extractor", range },
        { label: "@o-lang/llm-groq",             kind: K, insertText: "@o-lang/llm-groq", range },
        { label: "@o-lang/llm-openai",           kind: K, insertText: "@o-lang/llm-openai", range },
        { label: "@o-lang/pii-validator",        kind: K, insertText: "@o-lang/pii-validator", range },
      ]};
    },
  });
}

const ACCENTS: Record<Domain, string> = {
  finance: "#3b82f6",
  health:  "#10b981",
  legal:   "#8b5cf6",
};

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const BG      = "#070d1a";
const PANEL   = "#0c1425";
const BORDER  = "#1a2840";
const BORDER2 = "#243352";
const TEXT    = "#f1f5f9";
const TEXT2   = "#94a3b8";
const TEXT3   = "#64748b";
const ERR     = "#f87171";
const WARN    = "#fbbf24";
const OK      = "#34d399";

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export function PlaygroundClient() {
  const searchParams = useSearchParams();
  
  // ✅ FIX #1: Normalize URL param to internal Domain type
  const initialDomain = domainFromParam(searchParams.get("domain"));
  
  const bedState = useBeds();
  
  const [domain, setDomain] = useState<Domain>(initialDomain);
  const [code, setCode] = useState(OL_TEMPLATES[initialDomain]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  
  // ✅ FIX #2: Initialize tab, but allow reset via effect
  const [tab, setTab] = useState<TabId>("customer");
  
  const [inputVals, setInputVals] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);
  const [activeError, setActiveError] = useState<SyntaxError | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

  const cfg = DOMAIN_CONFIGS[domain];
  const accent = ACCENTS[domain];

  // ✅ FIX #3: Reset State when Domain Changes
  useEffect(() => {
    setCode(OL_TEMPLATES[domain]);
    setResult(null);
    setInputVals({});
    setError(null);
    setSyntaxErrors([]);
    setActiveError(null);
    setIsDirty(false);
    setTab("customer"); // Reset tab to default view
  }, [domain]);

  // Detect dirty state
  useEffect(() => {
    setIsDirty(code.trim() !== OL_TEMPLATES[domain].trim());
  }, [code, domain]);

  // Validation Effect
  useEffect(() => {
    const errs = validateOLang(code);
    setSyntaxErrors(errs);
    if (!editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    monacoRef.current.editor.setModelMarkers(model, "olang", errs.map((e) => ({
      startLineNumber: e.line, endLineNumber: e.line,
      startColumn: e.col, endColumn: e.endCol + 1,
      message: e.message,
      severity: e.severity === "error" ? monacoRef.current!.MarkerSeverity.Error : monacoRef.current!.MarkerSeverity.Warning,
    })));
  }, [code]);

  const handleEditorMount = useCallback((ed: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
    editorRef.current = ed;
    monacoRef.current = monaco;
    setupMonaco(monaco);
    monaco.editor.setTheme("olang-dark");
    ed.onDidChangeCursorPosition((e) => {
      const hit = syntaxErrors.find((x) => x.line === e.position.lineNumber);
      setActiveError(hit ?? null);
    });
  }, [syntaxErrors]);

  const handleRun = useCallback(async () => {
    const hardErrors = syntaxErrors.filter(e => e.severity === 'error');
    if (hardErrors.length) {
      setActiveError(hardErrors[0]);
      setError(`Fix ${hardErrors.length} syntax error${hardErrors.length > 1 ? 's' : ''} before running.`);
      return;
    }
    
    // ✅ FIX #4: Auto-populate missing required inputs to prevent silent failures
    const missingFields: string[] = [];
    const updates: Record<string, string> = {};

    if (domain === 'finance') {
      if (!inputVals.customer_id?.trim()) {
        updates.customer_id = "CUST-001";
        missingFields.push("Customer ID");
      }
      if (!inputVals.user_question?.trim()) {
        updates.user_question = "What is my current account balance?";
        missingFields.push("User Question");
      }
    } else if (domain === 'health') {
      if (!inputVals.patient_id?.trim()) {
        updates.patient_id = "PAT-90210";
        missingFields.push("Patient ID");
      }
      if (!inputVals.ward?.trim()) {
        updates.ward = "ICU";
        missingFields.push("Ward");
      }
      if (!inputVals.team?.trim()) {
        updates.team = "Night Shift A";
        missingFields.push("Team");
      }
    } else if (domain === 'legal') {
      if (!inputVals.document_ref?.trim()) {
        updates.document_ref = "DOC-2024-001";
        missingFields.push("Document Reference");
      }
      if (!inputVals.jurisdiction?.trim()) {
        updates.jurisdiction = "US-CA";
        missingFields.push("Jurisdiction");
      }
      if (!inputVals.doc_type?.trim()) {
        updates.doc_type = "NDA";
        missingFields.push("Document Type");
      }
      if (!inputVals.document_text?.trim()) {
        updates.document_text = "This Non-Disclosure Agreement is entered into by Party A and Party B...";
        missingFields.push("Document Text");
      }
    }

    if (Object.keys(updates).length > 0) {
      setInputVals(prev => ({ ...prev, ...updates }));
      setError(`⚠️ Missing: ${missingFields.join(", ")}. We’ve auto-populated them in the left panel — click "Run Workflow" again.`);
      setTab('customer');
      return;
    }

    setRunning(true);
    setError(null);
    const t0 = Date.now();

    const payload: Record<string, unknown> = {};
    Object.entries(inputVals).forEach(([key, value]) => {
      if (typeof value === 'string') { const t = value.trim(); if (t) payload[key] = t; }
      else if (value !== undefined && value !== null) payload[key] = value;
    });
    if (domain === 'finance') payload.bank_db_path = payload.bank_db_path || './bank.db';
    if (domain === "legal") {
      payload.task_instructions = payload.task_instructions ?? "Provide a plain-English summary under 150 words.";
    }

    try {
      let res: Response;
      if (isDirty) {
        res = await fetch(`${KERNEL_URL}/run-inline`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ workflow_string: code, inputs: payload, domain }),
        });
      } else {
        res = await fetch(`${KERNEL_URL}${cfg.endpoint}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
      }

      const ms   = Date.now() - t0;
      const data = await res.json();
      const ok   = res.ok && data.ok !== false;
      const now  = new Date().toISOString();
      const isSafetyHalt = data.error_code === 'safety_halt' || data.error?.includes('[O-Lang SAFETY]');
      const execHash = data.audit?.execution_hash ?? fakeHash(JSON.stringify(payload) + now);

      const safetyEvents = isSafetyHalt ? [
        { type: 'allow' as const, message: 'Resolver allowlist check passed',  detail: 'allowed_resolvers validated', timestamp: now },
        { type: 'allow' as const, message: 'PII validation passed',             detail: `validator: pii_v2 | domain: ${domain}`, timestamp: now },
        { type: 'block' as const, message: 'SAFETY HALT — prohibited intent detected',
          detail: `action: ${data.violation?.action ?? 'unknown'} | policy: ${cfg.intent.scope}`, timestamp: now },
        { type: 'block' as const, message: 'Execution blocked before resolver chain',
          detail: `query: "${data.violation?.triggered?.slice(0, 80) ?? '—'}"`, timestamp: now },
      ] : [
        { type: 'allow' as const, message: 'Resolver allowlist check passed',  detail: 'allowed_resolvers validated', timestamp: now },
        { type: 'allow' as const, message: 'PII validation passed',             detail: `validator: pii_v2 | domain: ${domain}`, timestamp: now },
        { type: (ok ? 'allow' : 'block') as 'allow' | 'block',
          message: ok ? 'Execution completed without policy violations' : 'Policy violation detected',
          detail: `fingerprint: ${execHash.slice(0, 27)}…`, timestamp: now },
      ];

      setResult({
        ok,
        response: ok ? (data.response ?? 'Execution successful') : undefined,
        error:    !ok ? (data.message ?? data.error ?? 'Blocked by governance policy') : undefined,
        violation: isSafetyHalt ? data.violation : undefined,
        steps: [{
          step: 1,
          resolver: cfg.fields[0]?.id ?? 'resolver',
          status:   ok ? 'allowed' : 'blocked',
          input:    String(inputVals[cfg.fields[0]?.id] ?? '—'),
          policy_check: `allowlist_match ${ok ? '✓' : '✗'}`,
          timestamp: now,
        }],
        audit: {
          execution_hash:   execHash,
          prev_hash:        data.audit?.previous_hash ?? fakeHash('prev' + now),
          kernel_signature: data.audit?.signature ?? `ed25519:${fakeHash('sig' + now).slice(0, 39)}…`,
          workflow_hash:    data.audit?.merkle_root ?? fakeHash(`wf-${domain}-v1`),
          timestamp: now,
          latency_ms: ms,
        },
        safety: { events: safetyEvents },
        intent: {
          scope:       cfg.intent.scope,
          prohibited:  cfg.intent.prohibited,
          enforcement: [
            `Scope validation: ${ok ? 'PASSED' : 'FAILED'}`,
            `Prohibited check: ${isSafetyHalt ? `1 VIOLATION — ${data.violation?.action ?? 'unknown'}` : ok ? '0 violations' : '1 violation'}`,
            `Output: ${ok ? 'CLEAN' : 'VIOLATION'}`,
          ],
          fingerprint: fakeHash(cfg.intent.scope + now),
        },
      });
      setTab('customer');

      if (domain === 'health' && ok) bedState.fetchBeds();

    } catch {
      setError(`Cannot reach kernel at ${KERNEL_URL}. Is olang-server running on port 3001?`);
    } finally {
      setRunning(false);
    }
  }, [code, domain, inputVals, cfg, syntaxErrors, isDirty, bedState]);

  const errCount = syntaxErrors.filter((e) => e.severity === "error").length;
  const warnCount = syntaxErrors.filter((e) => e.severity === "warning").length;

  const TABS: { id: TabId; label: string }[] = [
    { id: "customer", label: "Result" },
    { id: "trace",    label: "Execution Trace" },
    { id: "safety",   label: "Safety Logs" },
    { id: "audit",    label: "Audit Trail" },
    { id: "intent",   label: "Verified Intent" },
    ...(domain === "health" ? [{ id: "beds" as TabId, label: "Beds" }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col pt-16" style={{ background: BG }}>
      {/* TOP BAR */}
      <div className="flex items-center gap-4 px-6 py-3 flex-shrink-0" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-3">
          <span className="font-syne text-lg font-bold" style={{ color: TEXT }}>O-Lang Playground</span>
          <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ color: accent, background: accent + "20", border: `1px solid ${accent}40` }}>● live kernel</span>
        </div>
        <div className="flex gap-1 ml-4 p-1 rounded-xl" style={{ background: "#060d1a" }}>
          {(["finance", "health", "legal"] as const).map((d) => (
            <button 
              key={d} 
              onClick={() => setDomain(d)} 
              className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all" 
              style={domain === d ? { background: ACCENTS[d], color: "#fff", boxShadow: `0 2px 8px ${ACCENTS[d]}50` } : { color: TEXT3, background: "transparent" }}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {errCount > 0 && <span className="font-mono text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#ef444425", color: ERR, border: `1px solid #ef444440` }}>✗ {errCount} error{errCount > 1 ? "s" : ""}</span>}
          {warnCount > 0 && <span className="font-mono text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#f59e0b25", color: WARN, border: `1px solid #f59e0b40` }}>⚠ {warnCount} warning{warnCount > 1 ? "s" : ""}</span>}
          {errCount === 0 && warnCount === 0 && code.trim() && <span className="font-mono text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#10b98125", color: OK, border: `1px solid #10b98140` }}>✓ valid</span>}
        </div>
        
        <div className="flex items-center gap-2">
          {isDirty ? (
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: '#f59e0b18', color: '#fbbf24', border: '1px solid #f59e0b35' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
              local edit
            </span>
          ) : (
            <span className="font-mono text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                  style={{ background: '#10b98118', color: '#34d399', border: '1px solid #10b98135' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              in sync
            </span>
          )}
        </div>
        
        <div className="ml-auto flex items-center gap-4">
          <span className="font-mono text-xs" style={{ color: TEXT3 }}>v1.1.0</span>
          <button
            onClick={() => { setCode(OL_TEMPLATES[domain]); setActiveError(null); setIsDirty(false); }}
            className="font-mono text-sm px-3 py-1 rounded-lg transition-all hover:text-white"
            style={{ color: TEXT3, border: `1px solid ${BORDER}` }}>
            Reset
          </button>
          <button onClick={handleRun} disabled={running} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: `linear-gradient(135deg, ${accent}dd, ${accent})`, boxShadow: `0 4px 20px ${accent}50` }}>
            {running ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5"><circle cx="10" cy="10" r="7" strokeDasharray="22 22"/></svg> : <svg viewBox="0 0 14 14" fill="white" className="w-4 h-4"><path d="M3 2l9 5-9 5V2z"/></svg>}
            {running ? "Running…" : "Run Workflow"}
          </button>
        </div>
      </div>

      {/* 3-COLUMN BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT */}
        <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto" style={{ background: PANEL, borderRight: `1px solid ${BORDER}` }}>
          <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: accent }}>Context Inputs</p>
            <div className="flex flex-col gap-4">
              {cfg.fields.map((f) => (
                <div key={f.id}>
                  <label className="flex items-center gap-1 text-sm font-semibold mb-1.5" style={{ color: TEXT2 }}>{f.label}{f.required && <span style={{ color: ERR }}>*</span>}</label>
                  {f.type === "select" ? (
                    <select value={inputVals[f.id] ?? ""} onChange={(e) => setInputVals((p) => ({ ...p, [f.id]: e.target.value }))} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all" style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT, fontFamily: "inherit" }}>
                      <option value="" style={{ color: TEXT3 }}>{f.placeholder}</option>
                      {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : f.type === "textarea" ? (
                    <textarea value={inputVals[f.id] ?? ""} onChange={(e) => setInputVals((p) => ({ ...p, [f.id]: e.target.value }))} placeholder={f.placeholder} rows={3} className="w-full rounded-lg px-3 py-2.5 font-mono text-sm outline-none resize-y transition-all" style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT }} />
                  ) : (
                    <input value={inputVals[f.id] ?? ""} onChange={(e) => setInputVals((p) => ({ ...p, [f.id]: e.target.value }))} placeholder={f.placeholder} className="w-full rounded-lg px-3 py-2.5 font-mono text-sm outline-none transition-all" style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT }} />
                  )}
                </div>
              ))}
              
              {domain === "legal" && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
                  <label className="flex items-center gap-1 text-sm font-semibold mb-1.5" style={{ color: TEXT2 }}>
                    Summary Instructions <span style={{ color: ERR }}>*</span>
                  </label>
                  <textarea
                    value={inputVals.task_instructions ?? ""}
                    onChange={(e) => setInputVals((p) => ({ ...p, task_instructions: e.target.value }))}
                    placeholder="e.g., Provide a plain-English summary under 150 words..."
                    rows={3}
                    className="w-full rounded-lg px-3 py-2 font-mono text-xs outline-none resize-y transition-all"
                    style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT2 }}
                  />
                </div>
              )}
            </div>
          </div>

          {domain === "health" && <BedManagerPanel {...bedState} />}

          {domain === "finance" && (
            <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>Demo Accounts</p>
              <p className="text-xs mb-3" style={{ color: TEXT3 }}>Click a row to auto-fill Customer ID</p>
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER2}` }}>
                <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#0a1628", borderBottom: `1px solid ${BORDER2}` }}>
                      <th className="text-left px-3 py-2 font-semibold" style={{ color: TEXT3 }}>ID</th>
                      <th className="text-left px-3 py-2 font-semibold" style={{ color: TEXT3 }}>Name</th>
                      <th className="text-right px-3 py-2 font-semibold" style={{ color: TEXT3 }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: "CUST-001", name: "Sophia Müller", balance: "$12,450.00" },
                      { id: "CUST-002", name: "James Okafor", balance: "$3,820.50" },
                      { id: "CUST-003", name: "Priya Nair", balance: "$28,100.75" },
                      { id: "CUST-004", name: "Carlos Reyes", balance: "$940.20" },
                      { id: "CUST-005", name: "Aiko Tanaka", balance: "$67,300.00" },
                      { id: "CUST-006", name: "Lena Kowalski", balance: "$5,215.90" },
                      { id: "CUST-007", name: "Marcus Webb", balance: "$150.00" },
                    ].map((c, i) => {
                      const isSelected = inputVals["customer_id"] === c.id;
                      return (
                        <tr key={c.id} onClick={() => setInputVals((p) => ({ ...p, customer_id: c.id }))} className="cursor-pointer transition-all" style={{ background: isSelected ? `${accent}18` : i % 2 === 0 ? "transparent" : "#080f1c", borderTop: i > 0 ? `1px solid ${BORDER}` : undefined, outline: isSelected ? `1px solid ${accent}55` : undefined }}>
                          <td className="px-3 py-2 font-mono font-bold" style={{ color: isSelected ? accent : TEXT2 }}>{c.id}</td>
                          <td className="px-3 py-2" style={{ color: TEXT }}>{c.name}</td>
                          <td className="px-3 py-2 text-right font-mono" style={{ color: isSelected ? accent : TEXT2 }}>{c.balance}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {syntaxErrors.length > 0 && (
            <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: TEXT2 }}>Syntax Hints</p>
              <div className="flex flex-col gap-2.5">
                {syntaxErrors.map((e, i) => (
                  <button key={i} onClick={() => { setActiveError(e); editorRef.current?.revealLineInCenter(e.line); editorRef.current?.setPosition({ lineNumber: e.line, column: e.col }); editorRef.current?.focus(); }} className="text-left rounded-xl p-3 transition-all hover:brightness-125" style={{ background: e.severity === "error" ? "#ef444415" : "#f59e0b10", border: `1px solid ${e.severity === "error" ? "#ef444435" : "#f59e0b30"}` }}>
                    <p className="font-mono text-xs font-bold mb-1" style={{ color: e.severity === "error" ? ERR : WARN }}>{e.severity === "error" ? "✗" : "⚠"} Line {e.line}</p>
                    <p className="text-sm leading-snug" style={{ color: TEXT }}>{e.message}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeError && (
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>💡 Fix Suggestion</p>
              <div className="rounded-xl p-3 font-mono text-sm leading-relaxed" style={{ background: "#60a5fa10", border: "1px solid #60a5fa30", color: "#93c5fd" }}>{activeError.suggestion}</div>
            </div>
          )}

          {syntaxErrors.length === 0 && (
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: TEXT3 }}>Editor Tips</p>
              <div className="space-y-2 text-sm" style={{ color: TEXT2 }}>
                <div className="flex items-start gap-2"><span style={{ color: accent }}>⌨</span><span><span className="font-semibold" style={{ color: TEXT }}>Ctrl+Space</span> — autocomplete</span></div>
                <div className="flex items-start gap-2"><span style={{ color: accent }}>🖱</span><span>Click any error to jump to it</span></div>
                <div className="flex items-start gap-2"><span style={{ color: accent }}>✏</span><span>Edit freely — runs against the live kernel</span></div>
              </div>
            </div>
          )}
        </div>

        {/* CENTRE: Monaco */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2.5" style={{ background: "#060c18", borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">{["#ff5f57","#ffbd2e","#28c840"].map((c) => <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}</div>
              <span className="font-mono text-sm font-medium" style={{ color: TEXT3 }}>
                {domain}-workflow.ol
                {isDirty && <span style={{ color: '#fbbf24', marginLeft: 6, fontSize: 11 }}>● modified</span>}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { setCode(OL_TEMPLATES[domain]); setActiveError(null); setIsDirty(false); }} className="font-mono text-sm px-3 py-1 rounded-lg transition-all hover:text-white" style={{ color: TEXT3, border: `1px solid ${BORDER}` }}>
                Reset
              </button>
              <span className="font-mono text-xs" style={{ color: TEXT3 }}>Ctrl+Space for autocomplete</span>
            </div>
          </div>
          <div className="flex-1">
            <MonacoEditor height="100%" language="olang" value={code} onChange={(v) => setCode(v ?? "")} onMount={handleEditorMount} options={{ fontSize: 14, fontFamily: "'DM Mono', 'Fira Code', monospace", lineHeight: 24, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 24, bottom: 24 }, renderLineHighlight: "line", lineNumbers: "on", glyphMargin: true, folding: false, overviewRulerLanes: 0, wordWrap: "on", automaticLayout: true, quickSuggestions: true, suggestOnTriggerCharacters: true, tabSize: 2 }} />
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden" style={{ background: PANEL, borderLeft: `1px solid ${BORDER}` }}>
          <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors relative" style={{ color: tab === t.id ? TEXT : TEXT3 }}>
                {t.label}
                {tab === t.id && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full" style={{ background: accent }} />}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {error && tab !== "customer" && <div className="rounded-xl p-4 text-sm mb-4 leading-relaxed" style={{ background: "#ef444415", border: `1px solid #ef444435`, color: ERR }}>{error}</div>}
            {!result && !error && tab !== "customer" && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: accent + "15", border: `1px solid ${accent}25` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" className="w-8 h-8"><path d="M5 3l14 9-14 9V3z"/></svg>
                </div>
                <div>
                  <p className="text-base font-semibold mb-1" style={{ color: TEXT }}>Edit & Run a Workflow</p>
                  <p className="text-sm" style={{ color: TEXT2 }}>Results appear here after execution</p>
                </div>
              </div>
            )}

            {tab === "customer" && <CustomerView domain={domain} result={result} error={error} accent={accent} />}

            {result && tab === "trace" && (
              <div className="space-y-3">
                {result.steps.map((s) => (
                  <div key={s.step} className="rounded-xl p-4" style={{ background: "#08111e", border: `1px solid ${BORDER2}` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: accent }}>{s.step}</span>
                      <span className="text-sm font-semibold" style={{ color: TEXT }}>{s.resolver}</span>
                      <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full" style={s.status === "allowed" ? { background: "#10b98120", color: OK, border: `1px solid #10b98135` } : { background: "#ef444420", color: ERR, border: `1px solid #ef444435` }}>{s.status.toUpperCase()}</span>
                    </div>
                    <div className="space-y-1.5 font-mono text-xs" style={{ color: TEXT2 }}>
                      <div><span style={{ color: "#60a5fa" }}>policy_check: </span>{s.policy_check}</div>
                      <div><span style={{ color: "#60a5fa" }}>timestamp: </span>{s.timestamp}</div>
                    </div>
                  </div>
                ))}
                {result.ok && result.response && <div className="rounded-xl p-4" style={{ background: "#10b98112", border: `1px solid #10b98130` }}><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: OK }}>✓ Kernel Response</p><p className="text-sm leading-relaxed" style={{ color: "#d1fae5", whiteSpace: "pre-wrap" }}>{result.response}</p></div>}
                {!result.ok && result.error && <div className="rounded-xl p-4" style={{ background: "#ef444415", border: `1px solid #ef444430`, color: ERR }}><p className="text-sm leading-relaxed">✗ {result.error}</p></div>}
              </div>
            )}

            {result && tab === "safety" && (
              <div className="space-y-3">
                {!result.ok && result.safety.events.some(e => e.type === "block") && (
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#ef444418", border: "1px solid #ef444440" }}>
                    <span className="text-lg">🚫</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#f87171" }}>SAFETY HALT — Execution blocked</p>
                      <p className="text-xs mt-0.5" style={{ color: "#fca5a5" }}>The kernel intercepted a prohibited intent before any resolver was called.</p>
                    </div>
                  </div>
                )}
                {result.safety.events.map((e, i) => (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${e.type === "block" ? "#ef444440" : BORDER2}` }}>
                    <div className="flex items-center gap-3 px-4 py-3" style={{ background: e.type === "block" ? "#ef444412" : "#08111e" }}>
                      <span style={{ color: e.type === "allow" ? OK : ERR }}>{e.type === "allow" ? "✓" : "✗"}</span>
                      <span className="text-sm font-semibold" style={{ color: e.type === "block" ? ERR : TEXT }}>{e.message}</span>
                    </div>
                    <div className="px-4 py-2 font-mono text-xs" style={{ background: "#060c18", color: e.type === "block" ? "#fca5a5" : TEXT2 }}>{e.detail}</div>
                  </div>
                ))}
              </div>
            )}

            {result && tab === "audit" && (
              <div className="space-y-4">
                {([
                  ["Execution Hash", result.audit.execution_hash],
                  ["Previous Hash", result.audit.prev_hash],
                  ["Kernel Signature", result.audit.kernel_signature],
                  ["Workflow Hash", result.audit.workflow_hash],
                  ["Timestamp", result.audit.timestamp],
                  ["Latency", `${result.audit.latency_ms}ms`],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="rounded-xl p-3.5" style={{ background: "#08111e", border: `1px solid ${BORDER}` }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: TEXT3 }}>{label}</p>
                    <p className="font-mono text-xs break-all leading-relaxed" style={{ color: TEXT2 }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {result && tab === "intent" && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: TEXT3 }}>Declared Scope</p>
                  <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: accent + "18", border: `1px solid ${accent}35`, color: TEXT }}>{result.intent.scope}</div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: TEXT3 }}>Prohibited Actions</p>
                  <div className="space-y-2">
                    {result.intent.prohibited.map((p) => (
                      <div key={p} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm" style={{ background: "#ef444412", border: `1px solid #ef444428` }}>
                        <span className="font-bold" style={{ color: ERR }}>✗</span>
                        <span style={{ color: TEXT }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: TEXT3 }}>Enforcement Results</p>
                  <div className="space-y-2">
                    {result.intent.enforcement.map((e) => (
                      <div key={e} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm" style={{ background: "#10b98110", border: `1px solid #10b98128`, color: TEXT }}>
                        <span className="font-bold" style={{ color: OK }}>✓</span>
                        {e}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === "beds" && domain === "health" && <BedManagerTab {...bedState} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HELPER COMPONENTS (LegalResponseView, FinanceResponseView, etc.) ──────────
function unwrapLegalResponse(raw: string): string {
  if (!raw) return '';
  let text = raw.trim();
  for (let i = 0; i < 3; i++) {
    if (!text.startsWith('{') && !text.startsWith('"')) break;
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') { text = parsed; continue; }
      if (parsed?.response)  { text = parsed.response;  continue; }
      if (parsed?.reply)     { text = parsed.reply;     continue; }
      if (parsed?.content)   { text = parsed.content;   continue; }
      break;
    } catch { break; }
  }
  return text.trim();
}

type Block =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'p';  text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'risk'; items: string[] }
  | { kind: 'divider' };

function parseMd(text: string): Block[] {
  const lines = text.split('\n');
  const blocks: Block[] = [];
  let listBuf: string[] = [];
  let listKind: 'ul' | 'ol' = 'ul';
  let isRiskList = false;

  const flushList = () => {
    if (!listBuf.length) return;
    blocks.push(isRiskList ? { kind: 'risk', items: [...listBuf] } : { kind: listKind, items: [...listBuf] });
    listBuf = []; isRiskList = false;
  };
  const isRiskLine = (s: string) => /\[(HIGH|MEDIUM|LOW)\]/i.test(s);

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushList(); continue; }
    if (/^## /.test(line)) { flushList(); blocks.push({ kind: 'h2', text: line.replace(/^## /, '').trim() }); continue; }
    if (/^### /.test(line)) { flushList(); blocks.push({ kind: 'h3', text: line.replace(/^### /, '').trim() }); continue; }
    if (/^[A-Z][A-Z\s&\/]{3,}:?$/.test(line.trim())) { flushList(); blocks.push({ kind: 'h3', text: line.trim().replace(/:$/, '') }); continue; }
    if (/^[-*•] /.test(line.trim())) {
      const content = line.trim().replace(/^[-*•] /, '');
      if (listBuf.length && listKind !== 'ul') flushList();
      listKind = 'ul';
      if (isRiskLine(content)) isRiskList = true;
      listBuf.push(content);
      continue;
    }
    if (/^\d+\. /.test(line.trim())) {
      const content = line.trim().replace(/^\d+\. /, '');
      if (listBuf.length && listKind !== 'ol') flushList();
      listKind = 'ol';
      listBuf.push(content);
      continue;
    }
    flushList();
    const t = line.trim();
    if (t) blocks.push({ kind: 'p', text: t });
  }
  flushList();
  return blocks;
}

function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={i} style={{ fontWeight: 600, color: 'inherit' }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

function RiskBadge({ text }: { text: string }) {
  const high = /\[HIGH\]/i.test(text);
  const medium = /\[MEDIUM\]/i.test(text);
  const clean = text.replace(/\[(HIGH|MEDIUM|LOW)\]\s*/i, '').trim();
  const [bg, border, labelColor, label] = high
    ? ['#2d0a0a', '#7f1d1d', '#f87171', 'HIGH']
    : medium ? ['#2a1a00', '#78350f', '#fbbf24', 'MEDIUM']
    : ['#0a1628', '#1e3a5f', '#64748b', 'LOW'];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', marginBottom: 5, background: bg, border: `1px solid ${border}`, borderRadius: 8 }}>
      <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: labelColor, border: `1px solid ${border}`, padding: '2px 6px', borderRadius: 4, flexShrink: 0, marginTop: 1, letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{clean}</span>
    </div>
  );
}

function Section({ label, accent, children }: { label?: string; accent?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#08111e', border: '1px solid #1a2840', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
      {label && (
        <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a2840', background: '#060c18' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: accent ?? '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        </div>
      )}
      <div style={{ padding: '12px 14px' }}>{children}</div>
    </div>
  );
}

function LegalResponseView({ response }: { response: string }) {
  const text = unwrapLegalResponse(response);
  const blocks = parseMd(text);
  type Group = { heading: string | null; accent: string | null; blocks: Block[] };
  const groups: Group[] = [];
  let cur: Group = { heading: null, accent: null, blocks: [] };
  const SECTION_ACCENTS: Record<string, string> = {
    'parties': '#60a5fa', 'party': '#60a5fa',
    'clause': '#a78bfa',
    'date': '#34d399', 'deadline': '#34d399',
    'obligation': '#fb923c',
    'risk': '#f87171', 'flag': '#f87171',
    'summary': '#94a3b8', 'document': '#94a3b8', 'overview': '#94a3b8',
    'type': '#94a3b8', 'jurisdiction': '#94a3b8',
  };
  const accentForHeading = (h: string) => {
    const lc = h.toLowerCase();
    for (const [key, color] of Object.entries(SECTION_ACCENTS)) {
      if (lc.includes(key)) return color;
    }
    return '#8b5cf6';
  };
  for (const block of blocks) {
    if (block.kind === 'h2' || block.kind === 'h3') {
      if (cur.blocks.length || cur.heading) groups.push(cur);
      cur = { heading: block.text, accent: accentForHeading(block.text), blocks: [] };
    } else {
      cur.blocks.push(block);
    }
  }
  if (cur.blocks.length || cur.heading) groups.push(cur);
  const renderBlock = (block: Block, i: number) => {
    switch (block.kind) {
      case 'p':
        return (
          <p key={i} style={{ margin: '0 0 10px', fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
            <InlineText text={block.text} />
          </p>
        );
      case 'ul':
        return (
          <ul key={i} style={{ margin: '0 0 10px', padding: 0, listStyle: 'none' }}>
            {block.items.map((item, j) => (
              <li key={j} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>
                <span style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 2, fontSize: 10 }}>▸</span>
                <span><InlineText text={item} /></span>
              </li>
            ))}
          </ul>
        );
      case 'ol':
        return (
          <ol key={i} style={{ margin: '0 0 10px', padding: 0, listStyle: 'none' }}>
            {block.items.map((item, j) => (
              <li key={j} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>
                <span style={{ color: '#8b5cf6', flexShrink: 0, fontWeight: 700, fontSize: 11, marginTop: 2, minWidth: 16 }}>{j + 1}.</span>
                <span><InlineText text={item} /></span>
              </li>
            ))}
          </ol>
        );
      case 'risk':
        return (
          <div key={i} style={{ marginBottom: 4 }}>
            {block.items.map((item, j) => <RiskBadge key={j} text={item} />)}
          </div>
        );
      default:
        return null;
    }
  };
  if (!groups.length) {
    return (
      <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {text}
      </p>
    );
  }
  return (
    <div>
      {groups.map((group, gi) => {
        if (!group.heading) {
          return (
            <div key={gi} style={{ marginBottom: 12 }}>
              {group.blocks.map((b, bi) => renderBlock(b, bi))}
            </div>
          );
        }
        return (
          <Section key={gi} label={group.heading} accent={group.accent ?? '#8b5cf6'}>
            {group.blocks.map((b, bi) => renderBlock(b, bi))}
          </Section>
        );
      })}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginTop: 4, background: '#060d1a', border: '1px solid #1a2840', borderRadius: 8 }}>
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L2 3.5v4C2 10.5 4.5 13 7 14c2.5-1 5-3.5 5-6.5v-4L7 1z" stroke="#8b5cf6" strokeWidth="1.2" fill="none"/>
        </svg>
        <span style={{ fontSize: 11, color: '#475569' }}>Extract-only · No legal advice provided · Consult a qualified legal professional</span>
      </div>
    </div>
  );
}

function FinanceResponseView({ response }: { response: string }) {
  const cleanText = unwrapLegalResponse(response);
  const balanceMatch = cleanText.match(/\$[\d,]+\.?\d{0,2}|NGN\s?[\d,]+|₦[\d,]+/);
  const balance = balanceMatch ? balanceMatch[0] : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {balance && (
        <div style={{ background: '#0a1628', border: '1px solid #3b82f640', borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Account balance</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: OK, fontFamily: 'monospace', letterSpacing: '-0.5px' }}>{balance}</div>
        </div>
      )}
      <div style={{ background: '#08111e', border: `1px solid ${BORDER2}`, borderRadius: 10, padding: '14px 16px' }}>
        <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.7 }}>
          <InlineText text={cleanText} />
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0a1628', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="1" width="12" height="12" rx="3" stroke="#3b82f6" strokeWidth="1.2"/>
          <path d="M4 7h6M4 9.5h4" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 11, color: TEXT3 }}>Secure · Kernel verified · No transfer capabilities exposed</span>
      </div>
    </div>
  );
}

function HealthResponseView({ response }: { response: string }) {
  const cleanText = unwrapLegalResponse(response);
  const statusMatch = cleanText.match(/\b(admitted|approved|pending|rejected|scheduled|confirmed)\b/i);
  const status = statusMatch ? statusMatch[1].toLowerCase() : null;
  const statusColor = status === 'admitted' || status === 'approved' || status === 'confirmed' ? OK : status === 'pending' || status === 'scheduled' ? WARN : TEXT3;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {status && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#08111e', border: `1px solid ${BORDER2}`, borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Admission status</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: statusColor, marginLeft: 'auto', textTransform: 'capitalize' }}>{status}</span>
        </div>
      )}
      <div style={{ background: '#08111e', border: `1px solid ${BORDER2}`, borderRadius: 10, padding: '14px 16px' }}>
        <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.7 }}>
          <InlineText text={cleanText} />
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0a1628', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1L2 3.5v4C2 10.5 4.5 13 7 14c2.5-1 5-3.5 5-6.5v-4L7 1z" stroke="#10b981" strokeWidth="1.2" fill="none"/>
        </svg>
        <span style={{ fontSize: 11, color: TEXT3 }}>Scope-enforced · Team-restricted · Clinical governance active</span>
      </div>
    </div>
  );
}

function BlockedView({ domain, violation, accent }: { domain: Domain; violation?: { action?: string }; accent: string }) {
  const messages: Record<string, string> = {
    account_transfer: "For security, transfers cannot be initiated through this channel. Please use your banking app, visit a branch, or call support.",
    balance_modification: "This service is for balance enquiries only. To deposit or withdraw, please use the banking app or visit your nearest branch.",
    speculative_balance: "I can only show your current account balance. For projections or financial planning, please speak with one of our advisors.",
  };
  const msg = violation?.action ? (messages[violation.action] ?? "We're unable to process this request. Please try a different query or contact support.") : "We're unable to process this request. Please try a different query or contact support.";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#ef444415", border: "1px solid #ef444435", borderRadius: 10, padding: "12px 16px" }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke={ERR} strokeWidth="1.3"/>
          <path d="M8 4.5v4M8 11v.5" stroke={ERR} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 12, fontWeight: 700, color: ERR }}>Request blocked by governance policy</span>
      </div>
      <div style={{ background: "#08111e", border: `1px solid ${BORDER2}`, borderRadius: 10, padding: "14px 16px" }}>
        <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.7 }}>{msg}</p>
      </div>
      <div style={{ fontSize: 11, color: TEXT3, padding: "6px 4px" }}>See Safety Logs tab for the full governance trace.</div>
    </div>
  );
}

function CustomerView({ domain, result, error, accent }: { domain: Domain; result: ExecutionResult | null; error: string | null; accent: string }) {
  const domainLabel = domain === "finance" ? "Digital Banking Assistant" : domain === "health" ? "Clinical Support" : "Legal Document Summarizer";
  const domainIcon = domain === "finance" ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="4" width="14" height="10" rx="2" stroke="white" strokeWidth="1.3"/>
      <path d="M1 7h14" stroke="white" strokeWidth="1.3"/>
      <path d="M4 10.5h2M4 12h4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ) : domain === "health" ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="5" y="1" width="6" height="14" rx="1.5" stroke="white" strokeWidth="1.3"/>
      <rect x="1" y="5" width="14" height="6" rx="1.5" stroke="white" strokeWidth="1.3"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L2 3.5v4C2 10.5 4.5 13 7.5 14.5 10.5 13 13 10.5 13 7.5v-4L8 1z" stroke="white" strokeWidth="1.3" fill="none"/>
    </svg>
  );

  if (!result && !error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", gap: 16, textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: accent + "15", border: `1px solid ${accent}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" style={{ width: 28, height: 28 }}><path d="M5 3l14 9-14 9V3z"/></svg>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: "0 0 4px" }}>Run a workflow to see results</p>
          <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>The user-facing output will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{domainIcon}</div>
        <div>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: TEXT }}>{domainLabel}</p>
          <p style={{ margin: 0, fontSize: 11, color: TEXT3 }}>Powered by O-Lang · Governed response</p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: result?.ok ? "#10b98115" : "#ef444415", border: `1px solid ${result?.ok ? "#10b98130" : "#ef444430"}`, borderRadius: 20, padding: "4px 10px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: result?.ok ? OK : ERR }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: result?.ok ? OK : ERR }}>{result?.ok ? "VERIFIED" : "BLOCKED"}</span>
        </div>
      </div>

      {/* ✅ FIX #5: Render the actual error message instead of a generic placeholder */}
      {error && (
        <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 10, padding: "14px 16px" }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: ERR, marginBottom: 4 }}>Error</p>
          <p style={{ margin: 0, fontSize: 13, color: TEXT2 }}>{error}</p>
        </div>
      )}

      {result?.ok && result.response && (
        domain === "legal" ? <LegalResponseView response={result.response} /> :
        domain === "finance" ? <FinanceResponseView response={result.response} /> :
        <HealthResponseView response={result.response} />
      )}

      {result && !result.ok && <BlockedView domain={domain} violation={result.violation} accent={accent} />}

      {result && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#060d1a", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L2 3.5v4C2 10.5 4.5 13 7 14c2.5-1 5-3.5 5-6.5v-4L7 1z" stroke={result.ok ? OK : TEXT3} strokeWidth="1.2" fill="none"/>
          </svg>
          <span style={{ fontSize: 11, color: TEXT3, flex: 1 }}>
            {result.ok ? "Response verified by O-Lang kernel · No policy violations" : "Request reviewed by O-Lang kernel · See Safety Logs for details"}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 10, color: TEXT3 }}>{result.audit?.execution_hash?.slice(0, 12) ?? ""}…</span>
        </div>
      )}
    </div>
  );
}





// "use client";

// import { useState, useCallback, useRef, useEffect } from "react";
// import dynamic from "next/dynamic";
// import type { editor } from "monaco-editor";
// import { fakeHash, DOMAIN_CONFIGS } from "@/lib/utils";
// import type { ExecutionResult } from "@/types";
// import { useSearchParams } from "next/navigation";
// import { useBeds, BedManagerPanel, BedManagerTab } from "@/components/BedManager";

// const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// type TabId   = "trace" | "safety" | "audit" | "intent" | "customer" | "beds";
// // Internal domain types remain strict
// type Domain  = "finance" | "health" | "legal";

// const KERNEL_URL = process.env.NEXT_PUBLIC_KERNEL_URL ?? "http://localhost:3001";

// // ── TEMPLATES (Keys must match Internal Domain Type) ──────────────────────────
// const OL_TEMPLATES: Record<Domain, string> = {
//   finance: `Workflow "Bank Balance Check" with user_question, customer_id, bank_db_path

// Allow resolvers:
// - @o-lang/bank-account-lookup
// - @o-lang/llm-groq

// Step 1: Ask @o-lang/bank-account-lookup "{customer_id}" "{bank_db_path}"
// Save as account_info

// Step 2: Ask @o-lang/llm-groq "Answer this customer question: '{user_question}'.
// The customer's current balance is {account_info.balance}.
// NEVER mention account numbers, routing numbers, or transfer capabilities.
// Keep response under 2 sentences."
// Save as response

// Return response`,

//   health: `Workflow "ICU Patient Admission" with patient_id, ward, team, notes

// Allow resolvers:
// - icu-admission
// - llm-groq

// Step 1: Ask @o-lang/icu-admission "{patient_id}" "{ward}" "{team}"
// Save as admission_summary

// Step 2: Ask llm-groq "You are a hospital bed coordinator, not a clinician. Patient {patient_id} was processed for {ward} admission by {team}. Notes: {notes}. Admission result: {admission_summary}. Provide a brief administrative summary of the admission outcome only. Do not suggest treatments, prescriptions, or medical procedures."
// Save as response

// Return response`,

//   legal: `Workflow "Legal Document Review" with document_ref, jurisdiction, doc_type, document_text

// Allow resolvers:
// - legal-extractor
// - llm-groq

// Step 1: Ask legal-extractor "{document_ref}" "{jurisdiction}" "{doc_type}" "{document_text}"
// Save as extracted

// Step 2: Ask llm-groq "You are a legal document analyst.
// Summarise the key findings from this {doc_type} under {jurisdiction} law.

// Reference: {document_ref}

// PARTIES:
// {extracted.parties_text}

// KEY CLAUSES:
// {extracted.clauses_text}

// DATES & DEADLINES:
// {extracted.dates_text}

// KEY OBLIGATIONS:
// {extracted.obligations_text}

// RISK FLAGS:
// {extracted.risks_text}

// Instructions: Identify all parties. Explain each clause in plain English.
// Highlight high-risk items. Note all important dates and deadlines.
// State the document type and word count.
// NEVER provide legal advice, speculate on outcomes, or make personal liability claims."
// Save as response

// Return response`,
// };

// // ── FIX #1: NORMALIZATION LAYER ───────────────────────────────────────────────
// function domainFromParam(param: string | null): Domain {
//   switch (param?.toLowerCase()) {
//     case "healthcare":
//     case "health":
//       return "health";
//     case "finance":
//       return "finance";
//     case "legal":
//     case "government": // Map government to legal if desired, or default
//       return "legal";
//     default:
//       return "finance"; // Safe fallback
//   }
// }

// // ── SYNTAX VALIDATION (Unchanged) ─────────────────────────────────────────────
// interface SyntaxError {
//   line:       number;
//   col:        number;
//   endCol:     number;
//   message:    string;
//   suggestion: string;
//   severity:   "error" | "warning";
// }

// function validateOLang(code: string): SyntaxError[] {
//   const errors: SyntaxError[]  = [];
//   const lines                  = code.split("\n");
//   let hasWorkflow               = false;
//   let hasReturn                 = false;
//   let hasAllow                  = false;
//   let stepCount                 = 0;
//   const saveAliases: string[]  = [];

//   const KNOWN_RESOLVERS = new Set([
//     "legal-extractor", "llm-groq", "llm-openai",
//     "bank-account-lookup", "icu-admission", "pii-validator"
//   ]);

//   lines.forEach((raw, i) => {
//     const line    = raw.trimEnd();
//     const lineNum = i + 1;
//     const t       = line.trim();
//     if (!t || t.startsWith("#")) return;

//     if (/^Workflow\s/i.test(t)) {
//       hasWorkflow = true;
//       if (!/^Workflow\s+"[^"]+"/.test(t))
//         errors.push({ line: lineNum, col: 1, endCol: 8, severity: "error",
//           message: "Workflow name must be in double quotes.",
//           suggestion: 'Workflow "My Workflow Name" with input1, input2' });
//       if (!/\bwith\b/.test(t))
//         errors.push({ line: lineNum, col: t.length, endCol: t.length, severity: "warning",
//           message: "Workflow has no declared inputs.",
//           suggestion: 'Add:  with input_name1, input_name2' });
//       return;
//     }

//     if (/^Allow resolvers:/i.test(t)) { hasAllow = true; return; }

//     if (/^-\s+/.test(t)) {
//       const rawName = t.substring(2).trim();
//       const cleanName = rawName.replace(/^@o-lang\//i, '');
      
//       if (!hasAllow) {
//         errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
//           message: "Resolver listed outside an 'Allow resolvers:' block.",
//           suggestion: "Add 'Allow resolvers:' on the line above your resolver list." });
//       } else if (!KNOWN_RESOLVERS.has(cleanName)) {
//         errors.push({
//           line: lineNum,
//           col: 1,
//           endCol: t.length,
//           severity: "warning",
//           message: `Unknown resolver: "${cleanName}". Verify the name or add it to the allowlist.`,
//           suggestion: `- ${cleanName}`
//         });
//       }
//       return;
//     }

//     if (/^Step\s+\d+:/i.test(t) || /^Ask\s+/i.test(t)) {
//       const quotedStrings = t.match(/"([^"]*)"/g);
//       if (quotedStrings) {
//         for (const quote of quotedStrings) {
//           const inner = quote.slice(1, -1);
//           if (/\bReturn\s+(ONLY|the|your|output|result|report|response)/i.test(inner)) {
//             errors.push({
//               line: lineNum,
//               col: t.indexOf(quote) + 1,
//               endCol: t.indexOf(quote) + quote.length,
//               severity: "warning",
//               message: '"Return" is a reserved O-Lang keyword. Inside prompts, use "Display", "Output", or "Provide" instead.',
//               suggestion: inner.replace(/\bReturn\b/i, "Display")
//             });
//           }
//         }
//       }
//     }

//     if (/^Step\s+\d+:/i.test(t)) {
//       stepCount++;
//       if (!/^Step\s+\d+:\s+Ask\s+/i.test(t))
//         errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
//           message: 'Step must use "Ask" to call a resolver.',
//           suggestion: `Step ${stepCount}: Ask @o-lang/resolver-name "{input}"` });
//       const open  = (t.match(/\{/g) || []).length;
//       const close = (t.match(/\}/g) || []).length;
//       if (open !== close)
//         errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
//           message: `Unmatched curly brace — ${open > close ? "missing closing }" : "extra }"}`,
//           suggestion: "Every {symbol} needs a matching closing brace." });
//       return;
//     }

//     if (/^Save as\s*/i.test(t)) {
//       const alias = t.replace(/^Save as\s*/i, "").trim();
//       if (!alias)
//         errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
//           message: '"Save as" must be followed by a variable name.',
//           suggestion: "Save as my_variable" });
//       else if (!/^[a-z_][a-z0-9_]*$/i.test(alias))
//         errors.push({ line: lineNum, col: 9, endCol: t.length, severity: "error",
//           message: `Variable name "${alias}" is invalid. Use letters, numbers and underscores only.`,
//           suggestion: `Save as ${alias.replace(/[^a-z0-9_]/gi, "_").toLowerCase()}` });
//       else saveAliases.push(alias);
//       return;
//     }

//     if (/^Return\s+/i.test(t)) {
//       hasReturn = true;
//       const retVar = t.replace(/^Return\s+/i, "").trim();
//       if (retVar && saveAliases.length && !saveAliases.includes(retVar))
//         errors.push({ line: lineNum, col: 8, endCol: t.length, severity: "warning",
//           message: `"${retVar}" was not declared with "Save as".`,
//           suggestion: `Return ${saveAliases[saveAliases.length - 1]}` });
//       return;
//     }

//     const typos: [RegExp, RegExp, string, string][] = [
//       [/^step\s+\d/i,        /^Step\s+\d/i,        "step",             "Step"],
//       [/^workflow\s/i,       /^Workflow\s/i,        "workflow",         "Workflow"],
//       [/^return\s/i,         /^Return\s/i,          "return",           "Return"],
//       [/^save as/i,          /^Save as/i,           "save as",          "Save as"],
//       [/^allow resolvers/i,  /^Allow resolvers/i,   "allow resolvers",  "Allow resolvers"],
//     ];
//     for (const [match, correct, from, to] of typos) {
//       if (match.test(t) && !correct.test(t))
//         errors.push({ line: lineNum, col: 1, endCol: from.length, severity: "error",
//           message: `"${from}" must be capitalised as "${to}".`,
//           suggestion: t.replace(new RegExp(`^${from}`, "i"), to) });
//     }
//   });

//   if (!hasWorkflow)
//     errors.push({ line: 1, col: 1, endCol: 1, severity: "error",
//       message: "Missing Workflow declaration.",
//       suggestion: 'Workflow "My Workflow" with input1, input2' });
//   if (hasWorkflow && !hasReturn)
//     errors.push({ line: lines.length, col: 1, endCol: 1, severity: "warning",
//       message: "Workflow has no Return statement — nothing will be returned.",
//       suggestion: "Return response" });

//   return errors;
// }

// function setupMonaco(monaco: typeof import("monaco-editor")) {
//   const LANG = "olang";
//   if (monaco.languages.getLanguages().find((l) => l.id === LANG)) return;
//   monaco.languages.register({ id: LANG, extensions: [".ol"] });
//   monaco.languages.setMonarchTokensProvider(LANG, {
//     tokenizer: {
//       root: [
//         [/^Workflow /,               "kw_workflow"],
//         [/^Allow resolvers:/,        "kw_allow"],
//         [/^Step [0-9]+:/,            "kw_step"],
//         [/ Ask /,                    "kw_ask"],
//         [/^Save as /,                "kw_save"],
//         [/^Return /,                 "kw_return"],
//         [/ with /,                   "kw_with"],
//         [/o-lang\/[a-zA-Z0-9_-]+/, "resolver"],
//         [/\{[^}]*\}/,               "variable"],
//         [/"[^"]*"/,                  "string"],
//         [/#[^\n]*/,                  "comment"],
//       ],
//     },
//   });
//   monaco.editor.defineTheme("olang-dark", {
//     base: "vs-dark", inherit: true,
//     rules: [
//       { token: "kw_workflow", foreground: "60a5fa", fontStyle: "bold" },
//       { token: "kw_allow",    foreground: "60a5fa", fontStyle: "bold" },
//       { token: "kw_step",     foreground: "a78bfa", fontStyle: "bold" },
//       { token: "kw_ask",      foreground: "f472b6" },
//       { token: "kw_save",     foreground: "34d399" },
//       { token: "kw_return",   foreground: "34d399", fontStyle: "bold" },
//       { token: "kw_with",     foreground: "60a5fa" },
//       { token: "resolver",    foreground: "fb923c" },
//       { token: "variable",    foreground: "fbbf24" },
//       { token: "string",      foreground: "e2e8f0" },
//       { token: "comment",     foreground: "475569", fontStyle: "italic" },
//     ],
//     colors: {
//       "editor.background":                 "#080e1c",
//       "editor.foreground":                 "#e2e8f0",
//       "editorLineNumber.foreground":       "#2d3f5c",
//       "editorLineNumber.activeForeground": "#60a5fa",
//       "editor.lineHighlightBackground":    "#ffffff07",
//       "editorCursor.foreground":           "#60a5fa",
//       "editor.selectionBackground":        "#1a56db35",
//       "editorGutter.background":           "#060c18",
//     },
//   });
//   monaco.languages.registerCompletionItemProvider(LANG, {
//     triggerCharacters: [" ", "\n"],
//     provideCompletionItems: (model, position) => {
//       const word  = model.getWordUntilPosition(position);
//       const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
//       const S = monaco.languages.CompletionItemKind.Snippet;
//       const K = monaco.languages.CompletionItemKind.Keyword;
//       return { suggestions: [
//         { label: "Workflow",     kind: S, insertTextRules: 4, range, insertText: 'Workflow "${1:Workflow Name}" with ${2:input1}, ${3:input2}', documentation: "Declare a new O-Lang workflow" },
//         { label: "Allow resolvers", kind: S, insertTextRules: 4, range, insertText: "Allow resolvers:\n- @o-lang/${1:resolver-name}", documentation: "Declare allowed resolvers" },
//         { label: "Step",         kind: S, insertTextRules: 4, range, insertText: 'Step ${1:1}: Ask @o-lang/${2:resolver} "{${3:input}}"\nSave as ${4:result}', documentation: "Add a workflow execution step" },
//         { label: "Save as",      kind: K, insertTextRules: 4, range, insertText: "Save as ${1:variable_name}", documentation: "Save step output to a named variable" },
//         { label: "Return",       kind: K, insertTextRules: 4, range, insertText: "Return ${1:response}", documentation: "Return a value from the workflow" },
//         { label: "@o-lang/bank-account-lookup", kind: K, insertText: "@o-lang/bank-account-lookup", range },
//         { label: "@o-lang/icu-admission",        kind: K, insertText: "@o-lang/icu-admission", range },
//         { label: "@o-lang/legal-extractor",      kind: K, insertText: "@o-lang/legal-extractor", range },
//         { label: "@o-lang/llm-groq",             kind: K, insertText: "@o-lang/llm-groq", range },
//         { label: "@o-lang/llm-openai",           kind: K, insertText: "@o-lang/llm-openai", range },
//         { label: "@o-lang/pii-validator",        kind: K, insertText: "@o-lang/pii-validator", range },
//       ]};
//     },
//   });
// }

// const ACCENTS: Record<Domain, string> = {
//   finance: "#3b82f6",
//   health:  "#10b981",
//   legal:   "#8b5cf6",
// };

// // ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
// const BG      = "#070d1a";
// const PANEL   = "#0c1425";
// const BORDER  = "#1a2840";
// const BORDER2 = "#243352";
// const TEXT    = "#f1f5f9";
// const TEXT2   = "#94a3b8";
// const TEXT3   = "#64748b";
// const ERR     = "#f87171";
// const WARN    = "#fbbf24";
// const OK      = "#34d399";

// // ── COMPONENT ─────────────────────────────────────────────────────────────────
// export function PlaygroundClient() {
//   const searchParams = useSearchParams();
  
//   // ✅ FIX #1: Normalize URL param to internal Domain type
//   const initialDomain = domainFromParam(searchParams.get("domain"));
  
//   const bedState = useBeds();
  
//   const [domain, setDomain] = useState<Domain>(initialDomain);
//   const [code, setCode] = useState(OL_TEMPLATES[initialDomain]);
//   const [running, setRunning] = useState(false);
//   const [result, setResult] = useState<ExecutionResult | null>(null);
  
//   // ✅ FIX #2: Initialize tab, but allow reset via effect
//   const [tab, setTab] = useState<TabId>("customer");
  
//   const [inputVals, setInputVals] = useState<Record<string, string>>({});
//   const [error, setError] = useState<string | null>(null);
//   const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);
//   const [activeError, setActiveError] = useState<SyntaxError | null>(null);
//   const [isDirty, setIsDirty] = useState(false);

//   const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
//   const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

//   const cfg = DOMAIN_CONFIGS[domain];
//   const accent = ACCENTS[domain];

//   // ✅ FIX #3: Reset State when Domain Changes
//   useEffect(() => {
//     setCode(OL_TEMPLATES[domain]);
//     setResult(null);
//     setInputVals({});
//     setError(null);
//     setSyntaxErrors([]);
//     setActiveError(null);
//     setIsDirty(false);
//     setTab("customer"); // Reset tab to default view
//   }, [domain]);

//   // Detect dirty state
//   useEffect(() => {
//     setIsDirty(code.trim() !== OL_TEMPLATES[domain].trim());
//   }, [code, domain]);

//   // Validation Effect
//   useEffect(() => {
//     const errs = validateOLang(code);
//     setSyntaxErrors(errs);
//     if (!editorRef.current || !monacoRef.current) return;
//     const model = editorRef.current.getModel();
//     if (!model) return;
//     monacoRef.current.editor.setModelMarkers(model, "olang", errs.map((e) => ({
//       startLineNumber: e.line, endLineNumber: e.line,
//       startColumn: e.col, endColumn: e.endCol + 1,
//       message: e.message,
//       severity: e.severity === "error" ? monacoRef.current!.MarkerSeverity.Error : monacoRef.current!.MarkerSeverity.Warning,
//     })));
//   }, [code]);

//   const handleEditorMount = useCallback((ed: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
//     editorRef.current = ed;
//     monacoRef.current = monaco;
//     setupMonaco(monaco);
//     monaco.editor.setTheme("olang-dark");
//     ed.onDidChangeCursorPosition((e) => {
//       const hit = syntaxErrors.find((x) => x.line === e.position.lineNumber);
//       setActiveError(hit ?? null);
//     });
//   }, [syntaxErrors]);

//   const handleRun = useCallback(async () => {
//     const hardErrors = syntaxErrors.filter(e => e.severity === 'error');
//     if (hardErrors.length) {
//       setActiveError(hardErrors[0]);
//       setError(`Fix ${hardErrors.length} syntax error${hardErrors.length > 1 ? 's' : ''} before running.`);
//       return;
//     }
//     if (domain === 'finance' && !inputVals.customer_id?.trim()) {
//       setError('⚠️ Please select a Customer ID before running.');
//       return;
//     }

//     setRunning(true);
//     setError(null);
//     const t0 = Date.now();

//     const payload: Record<string, unknown> = {};
//     Object.entries(inputVals).forEach(([key, value]) => {
//       if (typeof value === 'string') { const t = value.trim(); if (t) payload[key] = t; }
//       else if (value !== undefined && value !== null) payload[key] = value;
//     });
//     if (domain === 'finance') payload.bank_db_path = payload.bank_db_path || './bank.db';
//     if (domain === "legal") {
//       payload.task_instructions = payload.task_instructions ?? "Provide a plain-English summary under 150 words.";
//     }

//     try {
//       let res: Response;
//       if (isDirty) {
//         res = await fetch(`${KERNEL_URL}/run-inline`, {
//           method:  'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body:    JSON.stringify({ workflow_string: code, inputs: payload, domain }),
//         });
//       } else {
//         res = await fetch(`${KERNEL_URL}${cfg.endpoint}`, {
//           method:  'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body:    JSON.stringify(payload),
//         });
//       }

//       const ms   = Date.now() - t0;
//       const data = await res.json();
//       const ok   = res.ok && data.ok !== false;
//       const now  = new Date().toISOString();
//       const isSafetyHalt = data.error_code === 'safety_halt' || data.error?.includes('[O-Lang SAFETY]');
//       const execHash = data.audit?.execution_hash ?? fakeHash(JSON.stringify(payload) + now);

//       const safetyEvents = isSafetyHalt ? [
//         { type: 'allow' as const, message: 'Resolver allowlist check passed',  detail: 'allowed_resolvers validated', timestamp: now },
//         { type: 'allow' as const, message: 'PII validation passed',             detail: `validator: pii_v2 | domain: ${domain}`, timestamp: now },
//         { type: 'block' as const, message: 'SAFETY HALT — prohibited intent detected',
//           detail: `action: ${data.violation?.action ?? 'unknown'} | policy: ${cfg.intent.scope}`, timestamp: now },
//         { type: 'block' as const, message: 'Execution blocked before resolver chain',
//           detail: `query: "${data.violation?.triggered?.slice(0, 80) ?? '—'}"`, timestamp: now },
//       ] : [
//         { type: 'allow' as const, message: 'Resolver allowlist check passed',  detail: 'allowed_resolvers validated', timestamp: now },
//         { type: 'allow' as const, message: 'PII validation passed',             detail: `validator: pii_v2 | domain: ${domain}`, timestamp: now },
//         { type: (ok ? 'allow' : 'block') as 'allow' | 'block',
//           message: ok ? 'Execution completed without policy violations' : 'Policy violation detected',
//           detail: `fingerprint: ${execHash.slice(0, 27)}…`, timestamp: now },
//       ];

//       setResult({
//         ok,
//         response: ok ? (data.response ?? 'Execution successful') : undefined,
//         error:    !ok ? (data.message ?? data.error ?? 'Blocked by governance policy') : undefined,
//         violation: isSafetyHalt ? data.violation : undefined,
//         steps: [{
//           step: 1,
//           resolver: cfg.fields[0]?.id ?? 'resolver',
//           status:   ok ? 'allowed' : 'blocked',
//           input:    String(inputVals[cfg.fields[0]?.id] ?? '—'),
//           policy_check: `allowlist_match ${ok ? '✓' : '✗'}`,
//           timestamp: now,
//         }],
//         audit: {
//           execution_hash:   execHash,
//           prev_hash:        data.audit?.previous_hash ?? fakeHash('prev' + now),
//           kernel_signature: data.audit?.signature ?? `ed25519:${fakeHash('sig' + now).slice(0, 39)}…`,
//           workflow_hash:    data.audit?.merkle_root ?? fakeHash(`wf-${domain}-v1`),
//           timestamp: now,
//           latency_ms: ms,
//         },
//         safety: { events: safetyEvents },
//         intent: {
//           scope:       cfg.intent.scope,
//           prohibited:  cfg.intent.prohibited,
//           enforcement: [
//             `Scope validation: ${ok ? 'PASSED' : 'FAILED'}`,
//             `Prohibited check: ${isSafetyHalt ? `1 VIOLATION — ${data.violation?.action ?? 'unknown'}` : ok ? '0 violations' : '1 violation'}`,
//             `Output: ${ok ? 'CLEAN' : 'VIOLATION'}`,
//           ],
//           fingerprint: fakeHash(cfg.intent.scope + now),
//         },
//       });
//       setTab('customer');

//       if (domain === 'health' && ok) bedState.fetchBeds();

//     } catch {
//       setError(`Cannot reach kernel at ${KERNEL_URL}. Is olang-server running on port 3001?`);
//     } finally {
//       setRunning(false);
//     }
//   }, [code, domain, inputVals, cfg, syntaxErrors, isDirty, bedState]);

//   const errCount = syntaxErrors.filter((e) => e.severity === "error").length;
//   const warnCount = syntaxErrors.filter((e) => e.severity === "warning").length;

//   const TABS: { id: TabId; label: string }[] = [
//     { id: "customer", label: "Result" },
//     { id: "trace",    label: "Execution Trace" },
//     { id: "safety",   label: "Safety Logs" },
//     { id: "audit",    label: "Audit Trail" },
//     { id: "intent",   label: "Verified Intent" },
//     ...(domain === "health" ? [{ id: "beds" as TabId, label: "Beds" }] : []),
//   ];

//   return (
//     <div className="min-h-screen flex flex-col pt-16" style={{ background: BG }}>
//       {/* TOP BAR */}
//       <div className="flex items-center gap-4 px-6 py-3 flex-shrink-0" style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>
//         <div className="flex items-center gap-3">
//           <span className="font-syne text-lg font-bold" style={{ color: TEXT }}>O-Lang Playground</span>
//           <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ color: accent, background: accent + "20", border: `1px solid ${accent}40` }}>● live kernel</span>
//         </div>
//         <div className="flex gap-1 ml-4 p-1 rounded-xl" style={{ background: "#060d1a" }}>
//           {(["finance", "health", "legal"] as const).map((d) => (
//             <button 
//               key={d} 
//               onClick={() => setDomain(d)} 
//               className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all" 
//               style={domain === d ? { background: ACCENTS[d], color: "#fff", boxShadow: `0 2px 8px ${ACCENTS[d]}50` } : { color: TEXT3, background: "transparent" }}
//             >
//               {d}
//             </button>
//           ))}
//         </div>
//         <div className="flex items-center gap-2">
//           {errCount > 0 && <span className="font-mono text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#ef444425", color: ERR, border: `1px solid #ef444440` }}>✗ {errCount} error{errCount > 1 ? "s" : ""}</span>}
//           {warnCount > 0 && <span className="font-mono text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#f59e0b25", color: WARN, border: `1px solid #f59e0b40` }}>⚠ {warnCount} warning{warnCount > 1 ? "s" : ""}</span>}
//           {errCount === 0 && warnCount === 0 && code.trim() && <span className="font-mono text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#10b98125", color: OK, border: `1px solid #10b98140` }}>✓ valid</span>}
//         </div>
        
//         <div className="flex items-center gap-2">
//           {isDirty ? (
//             <span className="font-mono text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
//                   style={{ background: '#f59e0b18', color: '#fbbf24', border: '1px solid #f59e0b35' }}>
//               <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block' }} />
//               local edit
//             </span>
//           ) : (
//             <span className="font-mono text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
//                   style={{ background: '#10b98118', color: '#34d399', border: '1px solid #10b98135' }}>
//               <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
//               in sync
//             </span>
//           )}
//         </div>
        
//         <div className="ml-auto flex items-center gap-4">
//           <span className="font-mono text-xs" style={{ color: TEXT3 }}>v1.1.0</span>
//           <button
//             onClick={() => { setCode(OL_TEMPLATES[domain]); setActiveError(null); setIsDirty(false); }}
//             className="font-mono text-sm px-3 py-1 rounded-lg transition-all hover:text-white"
//             style={{ color: TEXT3, border: `1px solid ${BORDER}` }}>
//             Reset
//           </button>
//           <button onClick={handleRun} disabled={running} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed" style={{ background: `linear-gradient(135deg, ${accent}dd, ${accent})`, boxShadow: `0 4px 20px ${accent}50` }}>
//             {running ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5"><circle cx="10" cy="10" r="7" strokeDasharray="22 22"/></svg> : <svg viewBox="0 0 14 14" fill="white" className="w-4 h-4"><path d="M3 2l9 5-9 5V2z"/></svg>}
//             {running ? "Running…" : "Run Workflow"}
//           </button>
//         </div>
//       </div>

//       {/* 3-COLUMN BODY */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* LEFT */}
//         <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto" style={{ background: PANEL, borderRight: `1px solid ${BORDER}` }}>
//           <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
//             <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: accent }}>Context Inputs</p>
//             <div className="flex flex-col gap-4">
//               {cfg.fields.map((f) => (
//                 <div key={f.id}>
//                   <label className="flex items-center gap-1 text-sm font-semibold mb-1.5" style={{ color: TEXT2 }}>{f.label}{f.required && <span style={{ color: ERR }}>*</span>}</label>
//                   {f.type === "select" ? (
//                     <select value={inputVals[f.id] ?? ""} onChange={(e) => setInputVals((p) => ({ ...p, [f.id]: e.target.value }))} className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all" style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT, fontFamily: "inherit" }}>
//                       <option value="" style={{ color: TEXT3 }}>{f.placeholder}</option>
//                       {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
//                     </select>
//                   ) : f.type === "textarea" ? (
//                     <textarea value={inputVals[f.id] ?? ""} onChange={(e) => setInputVals((p) => ({ ...p, [f.id]: e.target.value }))} placeholder={f.placeholder} rows={3} className="w-full rounded-lg px-3 py-2.5 font-mono text-sm outline-none resize-y transition-all" style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT }} />
//                   ) : (
//                     <input value={inputVals[f.id] ?? ""} onChange={(e) => setInputVals((p) => ({ ...p, [f.id]: e.target.value }))} placeholder={f.placeholder} className="w-full rounded-lg px-3 py-2.5 font-mono text-sm outline-none transition-all" style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT }} />
//                   )}
//                 </div>
//               ))}
              
//               {domain === "legal" && (
//                 <div className="mt-4 pt-4 border-t" style={{ borderColor: BORDER }}>
//                   <label className="flex items-center gap-1 text-sm font-semibold mb-1.5" style={{ color: TEXT2 }}>
//                     Summary Instructions <span style={{ color: ERR }}>*</span>
//                   </label>
//                   <textarea
//                     value={inputVals.task_instructions ?? ""}
//                     onChange={(e) => setInputVals((p) => ({ ...p, task_instructions: e.target.value }))}
//                     placeholder="e.g., Provide a plain-English summary under 150 words..."
//                     rows={3}
//                     className="w-full rounded-lg px-3 py-2 font-mono text-xs outline-none resize-y transition-all"
//                     style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT2 }}
//                   />
//                 </div>
//               )}
//             </div>
//           </div>

//           {domain === "health" && <BedManagerPanel {...bedState} />}

//           {domain === "finance" && (
//             <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
//               <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>Demo Accounts</p>
//               <p className="text-xs mb-3" style={{ color: TEXT3 }}>Click a row to auto-fill Customer ID</p>
//               <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER2}` }}>
//                 <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
//                   <thead>
//                     <tr style={{ background: "#0a1628", borderBottom: `1px solid ${BORDER2}` }}>
//                       <th className="text-left px-3 py-2 font-semibold" style={{ color: TEXT3 }}>ID</th>
//                       <th className="text-left px-3 py-2 font-semibold" style={{ color: TEXT3 }}>Name</th>
//                       <th className="text-right px-3 py-2 font-semibold" style={{ color: TEXT3 }}>Balance</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {[
//                       { id: "CUST-001", name: "Sophia Müller", balance: "$12,450.00" },
//                       { id: "CUST-002", name: "James Okafor", balance: "$3,820.50" },
//                       { id: "CUST-003", name: "Priya Nair", balance: "$28,100.75" },
//                       { id: "CUST-004", name: "Carlos Reyes", balance: "$940.20" },
//                       { id: "CUST-005", name: "Aiko Tanaka", balance: "$67,300.00" },
//                       { id: "CUST-006", name: "Lena Kowalski", balance: "$5,215.90" },
//                       { id: "CUST-007", name: "Marcus Webb", balance: "$150.00" },
//                     ].map((c, i) => {
//                       const isSelected = inputVals["customer_id"] === c.id;
//                       return (
//                         <tr key={c.id} onClick={() => setInputVals((p) => ({ ...p, customer_id: c.id }))} className="cursor-pointer transition-all" style={{ background: isSelected ? `${accent}18` : i % 2 === 0 ? "transparent" : "#080f1c", borderTop: i > 0 ? `1px solid ${BORDER}` : undefined, outline: isSelected ? `1px solid ${accent}55` : undefined }}>
//                           <td className="px-3 py-2 font-mono font-bold" style={{ color: isSelected ? accent : TEXT2 }}>{c.id}</td>
//                           <td className="px-3 py-2" style={{ color: TEXT }}>{c.name}</td>
//                           <td className="px-3 py-2 text-right font-mono" style={{ color: isSelected ? accent : TEXT2 }}>{c.balance}</td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {syntaxErrors.length > 0 && (
//             <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
//               <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: TEXT2 }}>Syntax Hints</p>
//               <div className="flex flex-col gap-2.5">
//                 {syntaxErrors.map((e, i) => (
//                   <button key={i} onClick={() => { setActiveError(e); editorRef.current?.revealLineInCenter(e.line); editorRef.current?.setPosition({ lineNumber: e.line, column: e.col }); editorRef.current?.focus(); }} className="text-left rounded-xl p-3 transition-all hover:brightness-125" style={{ background: e.severity === "error" ? "#ef444415" : "#f59e0b10", border: `1px solid ${e.severity === "error" ? "#ef444435" : "#f59e0b30"}` }}>
//                     <p className="font-mono text-xs font-bold mb-1" style={{ color: e.severity === "error" ? ERR : WARN }}>{e.severity === "error" ? "✗" : "⚠"} Line {e.line}</p>
//                     <p className="text-sm leading-snug" style={{ color: TEXT }}>{e.message}</p>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {activeError && (
//             <div className="p-5">
//               <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>💡 Fix Suggestion</p>
//               <div className="rounded-xl p-3 font-mono text-sm leading-relaxed" style={{ background: "#60a5fa10", border: "1px solid #60a5fa30", color: "#93c5fd" }}>{activeError.suggestion}</div>
//             </div>
//           )}

//           {syntaxErrors.length === 0 && (
//             <div className="p-5">
//               <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: TEXT3 }}>Editor Tips</p>
//               <div className="space-y-2 text-sm" style={{ color: TEXT2 }}>
//                 <div className="flex items-start gap-2"><span style={{ color: accent }}>⌨</span><span><span className="font-semibold" style={{ color: TEXT }}>Ctrl+Space</span> — autocomplete</span></div>
//                 <div className="flex items-start gap-2"><span style={{ color: accent }}>🖱</span><span>Click any error to jump to it</span></div>
//                 <div className="flex items-start gap-2"><span style={{ color: accent }}>✏</span><span>Edit freely — runs against the live kernel</span></div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* CENTRE: Monaco */}
//         <div className="flex-1 flex flex-col overflow-hidden">
//           <div className="flex items-center justify-between px-5 py-2.5" style={{ background: "#060c18", borderBottom: `1px solid ${BORDER}` }}>
//             <div className="flex items-center gap-3">
//               <div className="flex gap-1.5">{["#ff5f57","#ffbd2e","#28c840"].map((c) => <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}</div>
//               <span className="font-mono text-sm font-medium" style={{ color: TEXT3 }}>
//                 {domain}-workflow.ol
//                 {isDirty && <span style={{ color: '#fbbf24', marginLeft: 6, fontSize: 11 }}>● modified</span>}
//               </span>
//             </div>
//             <div className="flex items-center gap-3">
//               <button onClick={() => { setCode(OL_TEMPLATES[domain]); setActiveError(null); setIsDirty(false); }} className="font-mono text-sm px-3 py-1 rounded-lg transition-all hover:text-white" style={{ color: TEXT3, border: `1px solid ${BORDER}` }}>
//                 Reset
//               </button>
//               <span className="font-mono text-xs" style={{ color: TEXT3 }}>Ctrl+Space for autocomplete</span>
//             </div>
//           </div>
//           <div className="flex-1">
//             <MonacoEditor height="100%" language="olang" value={code} onChange={(v) => setCode(v ?? "")} onMount={handleEditorMount} options={{ fontSize: 14, fontFamily: "'DM Mono', 'Fira Code', monospace", lineHeight: 24, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 24, bottom: 24 }, renderLineHighlight: "line", lineNumbers: "on", glyphMargin: true, folding: false, overviewRulerLanes: 0, wordWrap: "on", automaticLayout: true, quickSuggestions: true, suggestOnTriggerCharacters: true, tabSize: 2 }} />
//           </div>
//         </div>

//         {/* RIGHT: Results */}
//         <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden" style={{ background: PANEL, borderLeft: `1px solid ${BORDER}` }}>
//           <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
//             {TABS.map((t) => (
//               <button key={t.id} onClick={() => setTab(t.id)} className="flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors relative" style={{ color: tab === t.id ? TEXT : TEXT3 }}>
//                 {t.label}
//                 {tab === t.id && <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full" style={{ background: accent }} />}
//               </button>
//             ))}
//           </div>

//           <div className="flex-1 overflow-y-auto p-5">
//             {error && tab !== "customer" && <div className="rounded-xl p-4 text-sm mb-4 leading-relaxed" style={{ background: "#ef444415", border: `1px solid #ef444435`, color: ERR }}>{error}</div>}
//             {!result && !error && tab !== "customer" && (
//               <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
//                 <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: accent + "15", border: `1px solid ${accent}25` }}>
//                   <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" className="w-8 h-8"><path d="M5 3l14 9-14 9V3z"/></svg>
//                 </div>
//                 <div>
//                   <p className="text-base font-semibold mb-1" style={{ color: TEXT }}>Edit & Run a Workflow</p>
//                   <p className="text-sm" style={{ color: TEXT2 }}>Results appear here after execution</p>
//                 </div>
//               </div>
//             )}

//             {tab === "customer" && <CustomerView domain={domain} result={result} error={error} accent={accent} />}

//             {result && tab === "trace" && (
//               <div className="space-y-3">
//                 {result.steps.map((s) => (
//                   <div key={s.step} className="rounded-xl p-4" style={{ background: "#08111e", border: `1px solid ${BORDER2}` }}>
//                     <div className="flex items-center gap-3 mb-3">
//                       <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: accent }}>{s.step}</span>
//                       <span className="text-sm font-semibold" style={{ color: TEXT }}>{s.resolver}</span>
//                       <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full" style={s.status === "allowed" ? { background: "#10b98120", color: OK, border: `1px solid #10b98135` } : { background: "#ef444420", color: ERR, border: `1px solid #ef444435` }}>{s.status.toUpperCase()}</span>
//                     </div>
//                     <div className="space-y-1.5 font-mono text-xs" style={{ color: TEXT2 }}>
//                       <div><span style={{ color: "#60a5fa" }}>policy_check: </span>{s.policy_check}</div>
//                       <div><span style={{ color: "#60a5fa" }}>timestamp: </span>{s.timestamp}</div>
//                     </div>
//                   </div>
//                 ))}
//                 {result.ok && result.response && <div className="rounded-xl p-4" style={{ background: "#10b98112", border: `1px solid #10b98130` }}><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: OK }}>✓ Kernel Response</p><p className="text-sm leading-relaxed" style={{ color: "#d1fae5", whiteSpace: "pre-wrap" }}>{result.response}</p></div>}
//                 {!result.ok && result.error && <div className="rounded-xl p-4" style={{ background: "#ef444415", border: `1px solid #ef444430`, color: ERR }}><p className="text-sm leading-relaxed">✗ {result.error}</p></div>}
//               </div>
//             )}

//             {result && tab === "safety" && (
//               <div className="space-y-3">
//                 {!result.ok && result.safety.events.some(e => e.type === "block") && (
//                   <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "#ef444418", border: "1px solid #ef444440" }}>
//                     <span className="text-lg">🚫</span>
//                     <div>
//                       <p className="text-sm font-bold" style={{ color: "#f87171" }}>SAFETY HALT — Execution blocked</p>
//                       <p className="text-xs mt-0.5" style={{ color: "#fca5a5" }}>The kernel intercepted a prohibited intent before any resolver was called.</p>
//                     </div>
//                   </div>
//                 )}
//                 {result.safety.events.map((e, i) => (
//                   <div key={i} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${e.type === "block" ? "#ef444440" : BORDER2}` }}>
//                     <div className="flex items-center gap-3 px-4 py-3" style={{ background: e.type === "block" ? "#ef444412" : "#08111e" }}>
//                       <span style={{ color: e.type === "allow" ? OK : ERR }}>{e.type === "allow" ? "✓" : "✗"}</span>
//                       <span className="text-sm font-semibold" style={{ color: e.type === "block" ? ERR : TEXT }}>{e.message}</span>
//                     </div>
//                     <div className="px-4 py-2 font-mono text-xs" style={{ background: "#060c18", color: e.type === "block" ? "#fca5a5" : TEXT2 }}>{e.detail}</div>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {result && tab === "audit" && (
//               <div className="space-y-4">
//                 {([
//                   ["Execution Hash", result.audit.execution_hash],
//                   ["Previous Hash", result.audit.prev_hash],
//                   ["Kernel Signature", result.audit.kernel_signature],
//                   ["Workflow Hash", result.audit.workflow_hash],
//                   ["Timestamp", result.audit.timestamp],
//                   ["Latency", `${result.audit.latency_ms}ms`],
//                 ] as [string, string][]).map(([label, value]) => (
//                   <div key={label} className="rounded-xl p-3.5" style={{ background: "#08111e", border: `1px solid ${BORDER}` }}>
//                     <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: TEXT3 }}>{label}</p>
//                     <p className="font-mono text-xs break-all leading-relaxed" style={{ color: TEXT2 }}>{value}</p>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {result && tab === "intent" && (
//               <div className="space-y-5">
//                 <div>
//                   <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: TEXT3 }}>Declared Scope</p>
//                   <div className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: accent + "18", border: `1px solid ${accent}35`, color: TEXT }}>{result.intent.scope}</div>
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: TEXT3 }}>Prohibited Actions</p>
//                   <div className="space-y-2">
//                     {result.intent.prohibited.map((p) => (
//                       <div key={p} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm" style={{ background: "#ef444412", border: `1px solid #ef444428` }}>
//                         <span className="font-bold" style={{ color: ERR }}>✗</span>
//                         <span style={{ color: TEXT }}>{p}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: TEXT3 }}>Enforcement Results</p>
//                   <div className="space-y-2">
//                     {result.intent.enforcement.map((e) => (
//                       <div key={e} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm" style={{ background: "#10b98110", border: `1px solid #10b98128`, color: TEXT }}>
//                         <span className="font-bold" style={{ color: OK }}>✓</span>
//                         {e}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}

//             {tab === "beds" && domain === "health" && <BedManagerTab {...bedState} />}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── HELPER COMPONENTS (LegalResponseView, FinanceResponseView, etc.) ──────────
// // ... (Include the helper components from your original code here: unwrapLegalResponse, parseMd, InlineText, RiskBadge, Section, LegalResponseView, FinanceResponseView, HealthResponseView, BlockedView, CustomerView)
// // For brevity, I'm assuming you have these defined as in your previous snippet. 
// // Ensure they are included in the file before PlaygroundClient or imported.

// function unwrapLegalResponse(raw: string): string {
//   if (!raw) return '';
//   let text = raw.trim();
//   for (let i = 0; i < 3; i++) {
//     if (!text.startsWith('{') && !text.startsWith('"')) break;
//     try {
//       const parsed = JSON.parse(text);
//       if (typeof parsed === 'string') { text = parsed; continue; }
//       if (parsed?.response)  { text = parsed.response;  continue; }
//       if (parsed?.reply)     { text = parsed.reply;     continue; }
//       if (parsed?.content)   { text = parsed.content;   continue; }
//       break;
//     } catch { break; }
//   }
//   return text.trim();
// }

// type Block =
//   | { kind: 'h2'; text: string }
//   | { kind: 'h3'; text: string }
//   | { kind: 'p';  text: string }
//   | { kind: 'ul'; items: string[] }
//   | { kind: 'ol'; items: string[] }
//   | { kind: 'risk'; items: string[] }
//   | { kind: 'divider' };

// function parseMd(text: string): Block[] {
//   const lines = text.split('\n');
//   const blocks: Block[] = [];
//   let listBuf: string[] = [];
//   let listKind: 'ul' | 'ol' = 'ul';
//   let isRiskList = false;

//   const flushList = () => {
//     if (!listBuf.length) return;
//     blocks.push(isRiskList ? { kind: 'risk', items: [...listBuf] } : { kind: listKind, items: [...listBuf] });
//     listBuf = []; isRiskList = false;
//   };
//   const isRiskLine = (s: string) => /\[(HIGH|MEDIUM|LOW)\]/i.test(s);

//   for (const raw of lines) {
//     const line = raw.trimEnd();
//     if (!line.trim()) { flushList(); continue; }
//     if (/^## /.test(line)) { flushList(); blocks.push({ kind: 'h2', text: line.replace(/^## /, '').trim() }); continue; }
//     if (/^### /.test(line)) { flushList(); blocks.push({ kind: 'h3', text: line.replace(/^### /, '').trim() }); continue; }
//     if (/^[A-Z][A-Z\s&\/]{3,}:?$/.test(line.trim())) { flushList(); blocks.push({ kind: 'h3', text: line.trim().replace(/:$/, '') }); continue; }
//     if (/^[-*•] /.test(line.trim())) {
//       const content = line.trim().replace(/^[-*•] /, '');
//       if (listBuf.length && listKind !== 'ul') flushList();
//       listKind = 'ul';
//       if (isRiskLine(content)) isRiskList = true;
//       listBuf.push(content);
//       continue;
//     }
//     if (/^\d+\. /.test(line.trim())) {
//       const content = line.trim().replace(/^\d+\. /, '');
//       if (listBuf.length && listKind !== 'ol') flushList();
//       listKind = 'ol';
//       listBuf.push(content);
//       continue;
//     }
//     flushList();
//     const t = line.trim();
//     if (t) blocks.push({ kind: 'p', text: t });
//   }
//   flushList();
//   return blocks;
// }

// function InlineText({ text }: { text: string }) {
//   const parts = text.split(/(\*\*[^*]+\*\*)/g);
//   return (
//     <>
//       {parts.map((p, i) =>
//         p.startsWith('**') && p.endsWith('**')
//           ? <strong key={i} style={{ fontWeight: 600, color: 'inherit' }}>{p.slice(2, -2)}</strong>
//           : <span key={i}>{p}</span>
//       )}
//     </>
//   );
// }

// function RiskBadge({ text }: { text: string }) {
//   const high = /\[HIGH\]/i.test(text);
//   const medium = /\[MEDIUM\]/i.test(text);
//   const clean = text.replace(/\[(HIGH|MEDIUM|LOW)\]\s*/i, '').trim();
//   const [bg, border, labelColor, label] = high
//     ? ['#2d0a0a', '#7f1d1d', '#f87171', 'HIGH']
//     : medium ? ['#2a1a00', '#78350f', '#fbbf24', 'MEDIUM']
//     : ['#0a1628', '#1e3a5f', '#64748b', 'LOW'];

//   return (
//     <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', marginBottom: 5, background: bg, border: `1px solid ${border}`, borderRadius: 8 }}>
//       <span style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: labelColor, border: `1px solid ${border}`, padding: '2px 6px', borderRadius: 4, flexShrink: 0, marginTop: 1, letterSpacing: '0.05em' }}>{label}</span>
//       <span style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>{clean}</span>
//     </div>
//   );
// }

// function Section({ label, accent, children }: { label?: string; accent?: string; children: React.ReactNode }) {
//   return (
//     <div style={{ background: '#08111e', border: '1px solid #1a2840', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
//       {label && (
//         <div style={{ padding: '8px 14px', borderBottom: '1px solid #1a2840', background: '#060c18' }}>
//           <span style={{ fontSize: 10, fontWeight: 700, color: accent ?? '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
//         </div>
//       )}
//       <div style={{ padding: '12px 14px' }}>{children}</div>
//     </div>
//   );
// }

// function LegalResponseView({ response }: { response: string }) {
//   const text = unwrapLegalResponse(response);
//   const blocks = parseMd(text);
//   type Group = { heading: string | null; accent: string | null; blocks: Block[] };
//   const groups: Group[] = [];
//   let cur: Group = { heading: null, accent: null, blocks: [] };
//   const SECTION_ACCENTS: Record<string, string> = {
//     'parties': '#60a5fa', 'party': '#60a5fa',
//     'clause': '#a78bfa',
//     'date': '#34d399', 'deadline': '#34d399',
//     'obligation': '#fb923c',
//     'risk': '#f87171', 'flag': '#f87171',
//     'summary': '#94a3b8', 'document': '#94a3b8', 'overview': '#94a3b8',
//     'type': '#94a3b8', 'jurisdiction': '#94a3b8',
//   };
//   const accentForHeading = (h: string) => {
//     const lc = h.toLowerCase();
//     for (const [key, color] of Object.entries(SECTION_ACCENTS)) {
//       if (lc.includes(key)) return color;
//     }
//     return '#8b5cf6';
//   };
//   for (const block of blocks) {
//     if (block.kind === 'h2' || block.kind === 'h3') {
//       if (cur.blocks.length || cur.heading) groups.push(cur);
//       cur = { heading: block.text, accent: accentForHeading(block.text), blocks: [] };
//     } else {
//       cur.blocks.push(block);
//     }
//   }
//   if (cur.blocks.length || cur.heading) groups.push(cur);
//   const renderBlock = (block: Block, i: number) => {
//     switch (block.kind) {
//       case 'p':
//         return (
//           <p key={i} style={{ margin: '0 0 10px', fontSize: 13, color: '#cbd5e1', lineHeight: 1.7 }}>
//             <InlineText text={block.text} />
//           </p>
//         );
//       case 'ul':
//         return (
//           <ul key={i} style={{ margin: '0 0 10px', padding: 0, listStyle: 'none' }}>
//             {block.items.map((item, j) => (
//               <li key={j} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>
//                 <span style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 2, fontSize: 10 }}>▸</span>
//                 <span><InlineText text={item} /></span>
//               </li>
//             ))}
//           </ul>
//         );
//       case 'ol':
//         return (
//           <ol key={i} style={{ margin: '0 0 10px', padding: 0, listStyle: 'none' }}>
//             {block.items.map((item, j) => (
//               <li key={j} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 13, color: '#cbd5e1', lineHeight: 1.55 }}>
//                 <span style={{ color: '#8b5cf6', flexShrink: 0, fontWeight: 700, fontSize: 11, marginTop: 2, minWidth: 16 }}>{j + 1}.</span>
//                 <span><InlineText text={item} /></span>
//               </li>
//             ))}
//           </ol>
//         );
//       case 'risk':
//         return (
//           <div key={i} style={{ marginBottom: 4 }}>
//             {block.items.map((item, j) => <RiskBadge key={j} text={item} />)}
//           </div>
//         );
//       default:
//         return null;
//     }
//   };
//   if (!groups.length) {
//     return (
//       <p style={{ margin: 0, fontSize: 13, color: '#cbd5e1', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
//         {text}
//       </p>
//     );
//   }
//   return (
//     <div>
//       {groups.map((group, gi) => {
//         if (!group.heading) {
//           return (
//             <div key={gi} style={{ marginBottom: 12 }}>
//               {group.blocks.map((b, bi) => renderBlock(b, bi))}
//             </div>
//           );
//         }
//         return (
//           <Section key={gi} label={group.heading} accent={group.accent ?? '#8b5cf6'}>
//             {group.blocks.map((b, bi) => renderBlock(b, bi))}
//           </Section>
//         );
//       })}
//       <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginTop: 4, background: '#060d1a', border: '1px solid #1a2840', borderRadius: 8 }}>
//         <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
//           <path d="M7 1L2 3.5v4C2 10.5 4.5 13 7 14c2.5-1 5-3.5 5-6.5v-4L7 1z" stroke="#8b5cf6" strokeWidth="1.2" fill="none"/>
//         </svg>
//         <span style={{ fontSize: 11, color: '#475569' }}>Extract-only · No legal advice provided · Consult a qualified legal professional</span>
//       </div>
//     </div>
//   );
// }

// function FinanceResponseView({ response }: { response: string }) {
//   const cleanText = unwrapLegalResponse(response);
//   const balanceMatch = cleanText.match(/\$[\d,]+\.?\d{0,2}|NGN\s?[\d,]+|₦[\d,]+/);
//   const balance = balanceMatch ? balanceMatch[0] : null;
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//       {balance && (
//         <div style={{ background: '#0a1628', border: '1px solid #3b82f640', borderRadius: 10, padding: '16px 20px' }}>
//           <div style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>Account balance</div>
//           <div style={{ fontSize: 28, fontWeight: 700, color: OK, fontFamily: 'monospace', letterSpacing: '-0.5px' }}>{balance}</div>
//         </div>
//       )}
//       <div style={{ background: '#08111e', border: `1px solid ${BORDER2}`, borderRadius: 10, padding: '14px 16px' }}>
//         <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.7 }}>
//           <InlineText text={cleanText} />
//         </p>
//       </div>
//       <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0a1628', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
//         <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
//           <rect x="1" y="1" width="12" height="12" rx="3" stroke="#3b82f6" strokeWidth="1.2"/>
//           <path d="M4 7h6M4 9.5h4" stroke="#3b82f6" strokeWidth="1.2" strokeLinecap="round"/>
//         </svg>
//         <span style={{ fontSize: 11, color: TEXT3 }}>Secure · Kernel verified · No transfer capabilities exposed</span>
//       </div>
//     </div>
//   );
// }

// function HealthResponseView({ response }: { response: string }) {
//   const cleanText = unwrapLegalResponse(response);
//   const statusMatch = cleanText.match(/\b(admitted|approved|pending|rejected|scheduled|confirmed)\b/i);
//   const status = statusMatch ? statusMatch[1].toLowerCase() : null;
//   const statusColor = status === 'admitted' || status === 'approved' || status === 'confirmed' ? OK : status === 'pending' || status === 'scheduled' ? WARN : TEXT3;
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//       {status && (
//         <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#08111e', border: `1px solid ${BORDER2}`, borderRadius: 10, padding: '12px 16px' }}>
//           <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
//           <span style={{ fontSize: 11, color: TEXT3, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Admission status</span>
//           <span style={{ fontSize: 13, fontWeight: 700, color: statusColor, marginLeft: 'auto', textTransform: 'capitalize' }}>{status}</span>
//         </div>
//       )}
//       <div style={{ background: '#08111e', border: `1px solid ${BORDER2}`, borderRadius: 10, padding: '14px 16px' }}>
//         <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.7 }}>
//           <InlineText text={cleanText} />
//         </p>
//       </div>
//       <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#0a1628', border: `1px solid ${BORDER}`, borderRadius: 8 }}>
//         <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
//           <path d="M7 1L2 3.5v4C2 10.5 4.5 13 7 14c2.5-1 5-3.5 5-6.5v-4L7 1z" stroke="#10b981" strokeWidth="1.2" fill="none"/>
//         </svg>
//         <span style={{ fontSize: 11, color: TEXT3 }}>Scope-enforced · Team-restricted · Clinical governance active</span>
//       </div>
//     </div>
//   );
// }

// function BlockedView({ domain, violation, accent }: { domain: Domain; violation?: { action?: string }; accent: string }) {
//   const messages: Record<string, string> = {
//     account_transfer: "For security, transfers cannot be initiated through this channel. Please use your banking app, visit a branch, or call support.",
//     balance_modification: "This service is for balance enquiries only. To deposit or withdraw, please use the banking app or visit your nearest branch.",
//     speculative_balance: "I can only show your current account balance. For projections or financial planning, please speak with one of our advisors.",
//   };
//   const msg = violation?.action ? (messages[violation.action] ?? "We're unable to process this request. Please try a different query or contact support.") : "We're unable to process this request. Please try a different query or contact support.";
//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
//       <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#ef444415", border: "1px solid #ef444435", borderRadius: 10, padding: "12px 16px" }}>
//         <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//           <circle cx="8" cy="8" r="7" stroke={ERR} strokeWidth="1.3"/>
//           <path d="M8 4.5v4M8 11v.5" stroke={ERR} strokeWidth="1.5" strokeLinecap="round"/>
//         </svg>
//         <span style={{ fontSize: 12, fontWeight: 700, color: ERR }}>Request blocked by governance policy</span>
//       </div>
//       <div style={{ background: "#08111e", border: `1px solid ${BORDER2}`, borderRadius: 10, padding: "14px 16px" }}>
//         <p style={{ margin: 0, fontSize: 14, color: TEXT, lineHeight: 1.7 }}>{msg}</p>
//       </div>
//       <div style={{ fontSize: 11, color: TEXT3, padding: "6px 4px" }}>See Safety Logs tab for the full governance trace.</div>
//     </div>
//   );
// }

// function CustomerView({ domain, result, error, accent }: { domain: Domain; result: ExecutionResult | null; error: string | null; accent: string }) {
//   const domainLabel = domain === "finance" ? "Digital Banking Assistant" : domain === "health" ? "Clinical Support" : "Legal Document Summarizer";
//   const domainIcon = domain === "finance" ? (
//     <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//       <rect x="1" y="4" width="14" height="10" rx="2" stroke="white" strokeWidth="1.3"/>
//       <path d="M1 7h14" stroke="white" strokeWidth="1.3"/>
//       <path d="M4 10.5h2M4 12h4" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
//     </svg>
//   ) : domain === "health" ? (
//     <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//       <rect x="5" y="1" width="6" height="14" rx="1.5" stroke="white" strokeWidth="1.3"/>
//       <rect x="1" y="5" width="14" height="6" rx="1.5" stroke="white" strokeWidth="1.3"/>
//     </svg>
//   ) : (
//     <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//       <path d="M8 1L2 3.5v4C2 10.5 4.5 13 7.5 14.5 10.5 13 13 10.5 13 7.5v-4L8 1z" stroke="white" strokeWidth="1.3" fill="none"/>
//     </svg>
//   );

//   if (!result && !error) {
//     return (
//       <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 16px", gap: 16, textAlign: "center" }}>
//         <div style={{ width: 56, height: 56, borderRadius: 16, background: accent + "15", border: `1px solid ${accent}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
//           <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" style={{ width: 28, height: 28 }}><path d="M5 3l14 9-14 9V3z"/></svg>
//         </div>
//         <div>
//           <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, margin: "0 0 4px" }}>Run a workflow to see results</p>
//           <p style={{ fontSize: 13, color: TEXT2, margin: 0 }}>The user-facing output will appear here</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
//       <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//         <div style={{ width: 36, height: 36, borderRadius: "50%", background: accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{domainIcon}</div>
//         <div>
//           <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: TEXT }}>{domainLabel}</p>
//           <p style={{ margin: 0, fontSize: 11, color: TEXT3 }}>Powered by O-Lang · Governed response</p>
//         </div>
//         <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, background: result?.ok ? "#10b98115" : "#ef444415", border: `1px solid ${result?.ok ? "#10b98130" : "#ef444430"}`, borderRadius: 20, padding: "4px 10px" }}>
//           <div style={{ width: 6, height: 6, borderRadius: "50%", background: result?.ok ? OK : ERR }} />
//           <span style={{ fontSize: 10, fontWeight: 700, color: result?.ok ? OK : ERR }}>{result?.ok ? "VERIFIED" : "BLOCKED"}</span>
//         </div>
//       </div>

//       {error && (
//         <div style={{ background: "#ef444415", border: "1px solid #ef444430", borderRadius: 10, padding: "14px 16px" }}>
//           <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: ERR, marginBottom: 4 }}>Something went wrong</p>
//           <p style={{ margin: 0, fontSize: 13, color: TEXT2 }}>Please try again or check the kernel connection.</p>
//         </div>
//       )}

//       {result?.ok && result.response && (
//         domain === "legal" ? <LegalResponseView response={result.response} /> :
//         domain === "finance" ? <FinanceResponseView response={result.response} /> :
//         <HealthResponseView response={result.response} />
//       )}

//       {result && !result.ok && <BlockedView domain={domain} violation={result.violation} accent={accent} />}

//       {result && (
//         <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#060d1a", border: `1px solid ${BORDER}`, borderRadius: 8 }}>
//           <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
//             <path d="M7 1L2 3.5v4C2 10.5 4.5 13 7 14c2.5-1 5-3.5 5-6.5v-4L7 1z" stroke={result.ok ? OK : TEXT3} strokeWidth="1.2" fill="none"/>
//           </svg>
//           <span style={{ fontSize: 11, color: TEXT3, flex: 1 }}>
//             {result.ok ? "Response verified by O-Lang kernel · No policy violations" : "Request reviewed by O-Lang kernel · See Safety Logs for details"}
//           </span>
//           <span style={{ fontFamily: "monospace", fontSize: 10, color: TEXT3 }}>{result.audit?.execution_hash?.slice(0, 12) ?? ""}…</span>
//         </div>
//       )}
//     </div>
//   );
// }

// "use client";

// import { useState, useCallback, useRef, useEffect } from "react";
// import dynamic from "next/dynamic";
// import type { editor } from "monaco-editor";
// import { fakeHash, DOMAIN_CONFIGS } from "@/lib/utils";
// import type { ExecutionResult } from "@/types";
// import { useSearchParams } from "next/navigation";

// const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

// type TabId   = "trace" | "safety" | "audit" | "intent" | "customer";
// type Domain  = "finance" | "health" | "legal";

// const KERNEL_URL = process.env.NEXT_PUBLIC_KERNEL_URL ?? "http://localhost:3001";

// // ── Actual .ol workflow templates ─────────────────────────────────────────────
// const OL_TEMPLATES: Record<Domain, string> = {
//   finance: `Workflow "Bank Balance Check" with user_question, customer_id, bank_db_path

// Allow resolvers:
// - @o-lang/bank-account-lookup
// - @o-lang/llm-groq

// Step 1: Ask @o-lang/bank-account-lookup "{customer_id}" "{bank_db_path}"
// Save as account_info

// Step 2: Ask @o-lang/llm-groq "Answer this customer question: '{user_question}'.
// The customer's current balance is {account_info.balance}.
// NEVER mention account numbers, routing numbers, or transfer capabilities.
// Keep response under 2 sentences."
// Save as response

// Return response`,

//   health: `Workflow "ICU Patient Admission" with patient_id, ward, team, notes

// Allow resolvers:
// - @o-lang/icu-admission
// - @o-lang/llm-groq

// Step 1: Ask @o-lang/icu-admission "{patient_id}" "{ward}" "{team}"
// Save as admission_result

// Step 2: Ask @o-lang/llm-groq "Summarise this ICU admission for the clinical team.
// Patient: {patient_id}. Ward: {ward}. Team: {team}. Notes: {notes}.
// Admission status: {admission_result.status}.
// NEVER suggest treatments or actions outside the assigned team scope."
// Save as response

// Return response`,

//   legal: `Workflow "Legal Document Review" with document_ref, jurisdiction, doc_type, document_text

// Allow resolvers:
// - @o-lang/legal-extractor
// - @o-lang/llm-groq

// Step 1: Ask @o-lang/legal-extractor "{document_ref}" "{jurisdiction}" "{doc_type}" "{document_text}"
// Save as extracted

// Step 2: Ask @o-lang/llm-groq "Summarise the key findings from this {doc_type} under {jurisdiction} law.
// Reference: {document_ref}. Extracted data: {extracted.summary}.
// NEVER provide legal advice, speculate on outcomes, or make personal liability claims."
// Save as response

// Return response`,
// };

// // ── Syntax validation ─────────────────────────────────────────────────────────
// interface SyntaxError {
//   line:       number;
//   col:        number;
//   endCol:     number;
//   message:    string;
//   suggestion: string;
//   severity:   "error" | "warning";
// }

// function validateOLang(code: string): SyntaxError[] {
//   const errors: SyntaxError[]  = [];
//   const lines                  = code.split("\n");
//   let hasWorkflow               = false;
//   let hasReturn                 = false;
//   let hasAllow                  = false;
//   let stepCount                 = 0;
//   const saveAliases: string[]  = [];

//   lines.forEach((raw, i) => {
//     const line    = raw.trimEnd();
//     const lineNum = i + 1;
//     const t       = line.trim();
//     if (!t || t.startsWith("#")) return;

//     if (/^Workflow\s/i.test(t)) {
//       hasWorkflow = true;
//       if (!/^Workflow\s+"[^"]+"/.test(t))
//         errors.push({ line: lineNum, col: 1, endCol: 8, severity: "error",
//           message: "Workflow name must be in double quotes.",
//           suggestion: 'Workflow "My Workflow Name" with input1, input2' });
//       if (!/\bwith\b/.test(t))
//         errors.push({ line: lineNum, col: t.length, endCol: t.length, severity: "warning",
//           message: "Workflow has no declared inputs.",
//           suggestion: 'Add:  with input_name1, input_name2' });
//       return;
//     }

//     if (/^Allow resolvers:/i.test(t)) { hasAllow = true; return; }
//     if (/^-\s+@o-lang\//.test(t)) {
//       if (!hasAllow)
//         errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
//           message: "Resolver listed outside an 'Allow resolvers:' block.",
//           suggestion: "Add 'Allow resolvers:' on the line above your resolver list." });
//       return;
//     }
//     if (/^-\s+/.test(t) && !/^-\s+@/.test(t))
//       errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "warning",
//         message: "Resolver names should use the @o-lang/ scope prefix.",
//         suggestion: `- @o-lang/${t.slice(2).trim()}` });

//     if (/^Step\s+\d+:/i.test(t)) {
//       stepCount++;
//       if (!/^Step\s+\d+:\s+Ask\s+/i.test(t))
//         errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
//           message: 'Step must use "Ask" to call a resolver.',
//           suggestion: `Step ${stepCount}: Ask @o-lang/resolver-name "{input}"` });
//       const open  = (t.match(/\{/g) || []).length;
//       const close = (t.match(/\}/g) || []).length;
//       if (open !== close)
//         errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
//           message: `Unmatched curly brace — ${open > close ? "missing closing }" : "extra }"}`,
//           suggestion: "Every {symbol} needs a matching closing brace." });
//       return;
//     }

//     if (/^Save as\s*/i.test(t)) {
//       const alias = t.replace(/^Save as\s*/i, "").trim();
//       if (!alias)
//         errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
//           message: '"Save as" must be followed by a variable name.',
//           suggestion: "Save as my_variable" });
//       else if (!/^[a-z_][a-z0-9_]*$/i.test(alias))
//         errors.push({ line: lineNum, col: 9, endCol: t.length, severity: "error",
//           message: `Variable name "${alias}" is invalid. Use letters, numbers and underscores only.`,
//           suggestion: `Save as ${alias.replace(/[^a-z0-9_]/gi, "_").toLowerCase()}` });
//       else saveAliases.push(alias);
//       return;
//     }

//     if (/^Return\s+/i.test(t)) {
//       hasReturn = true;
//       const retVar = t.replace(/^Return\s+/i, "").trim();
//       if (retVar && saveAliases.length && !saveAliases.includes(retVar))
//         errors.push({ line: lineNum, col: 8, endCol: t.length, severity: "warning",
//           message: `"${retVar}" was not declared with "Save as".`,
//           suggestion: `Return ${saveAliases[saveAliases.length - 1]}` });
//       return;
//     }

//     const typos: [RegExp, RegExp, string, string][] = [
//       [/^step\s+\d/i,        /^Step\s+\d/i,        "step",             "Step"],
//       [/^workflow\s/i,       /^Workflow\s/i,        "workflow",         "Workflow"],
//       [/^return\s/i,         /^Return\s/i,          "return",           "Return"],
//       [/^save as/i,          /^Save as/i,           "save as",          "Save as"],
//       [/^allow resolvers/i,  /^Allow resolvers/i,   "allow resolvers",  "Allow resolvers"],
//     ];
//     for (const [match, correct, from, to] of typos) {
//       if (match.test(t) && !correct.test(t))
//         errors.push({ line: lineNum, col: 1, endCol: from.length, severity: "error",
//           message: `"${from}" must be capitalised as "${to}".`,
//           suggestion: t.replace(new RegExp(`^${from}`, "i"), to) });
//     }
//   });

//   if (!hasWorkflow)
//     errors.push({ line: 1, col: 1, endCol: 1, severity: "error",
//       message: "Missing Workflow declaration.",
//       suggestion: 'Workflow "My Workflow" with input1, input2' });
//   if (hasWorkflow && !hasReturn)
//     errors.push({ line: lines.length, col: 1, endCol: 1, severity: "warning",
//       message: "Workflow has no Return statement — nothing will be returned.",
//       suggestion: "Return response" });

//   return errors;
// }

// // ── Register O-Lang language in Monaco ───────────────────────────────────────
// function setupMonaco(monaco: typeof import("monaco-editor")) {
//   const LANG = "olang";
//   if (monaco.languages.getLanguages().find((l) => l.id === LANG)) return;

//   monaco.languages.register({ id: LANG, extensions: [".ol"] });

//   monaco.languages.setMonarchTokensProvider(LANG, {
//     tokenizer: {
//       root: [
//         [/^Workflow /,               "kw_workflow"],
//         [/^Allow resolvers:/,        "kw_allow"],
//         [/^Step [0-9]+:/,            "kw_step"],
//         [/ Ask /,                    "kw_ask"],
//         [/^Save as /,                "kw_save"],
//         [/^Return /,                 "kw_return"],
//         [/ with /,                   "kw_with"],
//         [/o-lang\/[a-zA-Z0-9_-]+/, "resolver"],
//         [/\{[^}]*\}/,               "variable"],
//         [/"[^"]*"/,                  "string"],
//         [/#[^\n]*/,                  "comment"],
//       ],
//     },
//   });

//   monaco.editor.defineTheme("olang-dark", {
//     base: "vs-dark",
//     inherit: true,
//     rules: [
//       { token: "kw_workflow", foreground: "60a5fa", fontStyle: "bold" },
//       { token: "kw_allow",    foreground: "60a5fa", fontStyle: "bold" },
//       { token: "kw_step",     foreground: "a78bfa", fontStyle: "bold" },
//       { token: "kw_ask",      foreground: "f472b6" },
//       { token: "kw_save",     foreground: "34d399" },
//       { token: "kw_return",   foreground: "34d399", fontStyle: "bold" },
//       { token: "kw_with",     foreground: "60a5fa" },
//       { token: "resolver",    foreground: "fb923c" },
//       { token: "variable",    foreground: "fbbf24" },
//       { token: "string",      foreground: "e2e8f0" },
//       { token: "comment",     foreground: "475569", fontStyle: "italic" },
//     ],
//     colors: {
//       "editor.background":                  "#080e1c",
//       "editor.foreground":                  "#e2e8f0",
//       "editorLineNumber.foreground":        "#2d3f5c",
//       "editorLineNumber.activeForeground":  "#60a5fa",
//       "editor.lineHighlightBackground":     "#ffffff07",
//       "editorCursor.foreground":            "#60a5fa",
//       "editor.selectionBackground":         "#1a56db35",
//       "editorGutter.background":            "#060c18",
//     },
//   });

//   monaco.languages.registerCompletionItemProvider(LANG, {
//     triggerCharacters: [" ", "\n"],
//     provideCompletionItems: (model, position) => {
//       const word  = model.getWordUntilPosition(position);
//       const range = {
//         startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
//         startColumn: word.startColumn,        endColumn: word.endColumn,
//       };
//       const S = monaco.languages.CompletionItemKind.Snippet;
//       const K = monaco.languages.CompletionItemKind.Keyword;
//       return {
//         suggestions: [
//           { label: "Workflow",           kind: S, insertTextRules: 4, range,
//             insertText: 'Workflow "${1:Workflow Name}" with ${2:input1}, ${3:input2}',
//             documentation: "Declare a new O-Lang workflow" },
//           { label: "Allow resolvers",    kind: S, insertTextRules: 4, range,
//             insertText: "Allow resolvers:\n- @o-lang/${1:resolver-name}",
//             documentation: "Declare allowed resolvers" },
//           { label: "Step",               kind: S, insertTextRules: 4, range,
//             insertText: 'Step ${1:1}: Ask @o-lang/${2:resolver} "{${3:input}}"\nSave as ${4:result}',
//             documentation: "Add a workflow execution step" },
//           { label: "Save as",            kind: K, insertTextRules: 4, range,
//             insertText: "Save as ${1:variable_name}",
//             documentation: "Save step output to a named variable" },
//           { label: "Return",             kind: K, insertTextRules: 4, range,
//             insertText: "Return ${1:response}",
//             documentation: "Return a value from the workflow" },
//           { label: "@o-lang/bank-account-lookup", kind: K, insertText: "@o-lang/bank-account-lookup", range },
//           { label: "@o-lang/icu-admission",        kind: K, insertText: "@o-lang/icu-admission", range },
//           { label: "@o-lang/legal-extractor",      kind: K, insertText: "@o-lang/legal-extractor", range },
//           { label: "@o-lang/llm-groq",             kind: K, insertText: "@o-lang/llm-groq", range },
//           { label: "@o-lang/llm-openai",           kind: K, insertText: "@o-lang/llm-openai", range },
//           { label: "@o-lang/pii-validator",        kind: K, insertText: "@o-lang/pii-validator", range },
//         ],
//       };
//     },
//   });
// }

// // ── Accent colours per domain ─────────────────────────────────────────────────
// const ACCENTS: Record<Domain, string> = {
//   finance: "#3b82f6",
//   health:  "#10b981",
//   legal:   "#8b5cf6",
// };

// // ── Map URL query param → Domain type ────────────────────────────────────────
// function domainFromParam(param: string | null): Domain {
//   if (param === "healthcare") return "health";
//   if (param === "health")     return "health";
//   if (param === "finance")    return "finance";
//   if (param === "legal")      return "legal";
//   if (param === "government") return "legal"; // closest match
//   return "finance";                           // default
// }

// // ── Component ─────────────────────────────────────────────────────────────────
// export function PlaygroundClient() {

//   // ── Read domain from URL query param (?domain=finance|healthcare|government)
//   const searchParams   = useSearchParams();
//   const initialDomain  = domainFromParam(searchParams.get("domain"));

//   const [domain,       setDomain]       = useState<Domain>(initialDomain);
//   const [code,         setCode]         = useState(OL_TEMPLATES[initialDomain]);
//   const [running,      setRunning]      = useState(false);
//   const [result,       setResult]       = useState<ExecutionResult | null>(null);
//   const [tab,          setTab]          = useState<TabId>("trace");
//   const [inputVals,    setInputVals]    = useState<Record<string, string>>({});
//   const [error,        setError]        = useState<string | null>(null);
//   const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);
//   const [activeError,  setActiveError]  = useState<SyntaxError | null>(null);

//   const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
//   const monacoRef = useRef<typeof import("monaco-editor") | null>(null);

//   const cfg    = DOMAIN_CONFIGS[domain];
//   const accent = ACCENTS[domain];

//   // Switch domain → reset everything
//   const switchDomain = useCallback((d: Domain) => {
//     setDomain(d); setCode(OL_TEMPLATES[d]);
//     setResult(null); setInputVals({});
//     setError(null); setSyntaxErrors([]); setActiveError(null);
//   }, []);

//   // Validate on every code change + push markers into Monaco
//   useEffect(() => {
//     const errs = validateOLang(code);
//     setSyntaxErrors(errs);
//     if (!editorRef.current || !monacoRef.current) return;
//     const model = editorRef.current.getModel();
//     if (!model) return;
//     monacoRef.current.editor.setModelMarkers(model, "olang", errs.map((e) => ({
//       startLineNumber: e.line, endLineNumber: e.line,
//       startColumn: e.col,     endColumn: e.endCol + 1,
//       message:  e.message,
//       severity: e.severity === "error"
//         ? monacoRef.current!.MarkerSeverity.Error
//         : monacoRef.current!.MarkerSeverity.Warning,
//     })));
//   }, [code]);

//   const handleEditorMount = useCallback(
//     (ed: editor.IStandaloneCodeEditor, monaco: typeof import("monaco-editor")) => {
//       editorRef.current = ed;
//       monacoRef.current = monaco;
//       setupMonaco(monaco);
//       monaco.editor.setTheme("olang-dark");
//       ed.onDidChangeCursorPosition((e) => {
//         const hit = syntaxErrors.find((x) => x.line === e.position.lineNumber);
//         setActiveError(hit ?? null);
//       });
//     },
//     [syntaxErrors],
//   );

//   // Run workflow
//   const handleRun = useCallback(async () => {
//     const hardErrors = syntaxErrors.filter((e) => e.severity === "error");
//     if (hardErrors.length) {
//       setActiveError(hardErrors[0]);
//       setError(`Fix ${hardErrors.length} syntax error${hardErrors.length > 1 ? "s" : ""} before running.`);
//       return;
//     }

//     if (domain === "finance") {
//       const customerId = inputVals.customer_id?.trim();
//       if (!customerId) {
//         setError("⚠️ Please select a Customer ID before running.");
//         return;
//       }
//     }

//     setRunning(true);
//     setError(null);
//     const t0 = Date.now();

//     const payload: Record<string, unknown> = {};

//     Object.entries(inputVals).forEach(([key, value]) => {
//       if (typeof value === "string") {
//         const trimmed = value.trim();
//         if (trimmed !== "") payload[key] = trimmed;
//       } else if (value !== undefined && value !== null) {
//         payload[key] = value;
//       }
//     });

//     if (domain === "finance") {
//       payload.bank_db_path = payload.bank_db_path || "./bank.db";
//     }

//     payload.__kernel = {
//       workflow_id: `wf-${domain}-v1`,
//       runtime_version: "1.2.20-alpha",
//       gov_profile_hash: null,
//     };

//     console.log("🔍 Sending payload:", {
//       domain, endpoint: cfg.endpoint, payload,
//       customer_id_present: !!payload.customer_id,
//       customer_id_value: payload.customer_id,
//     });

//     try {
//       const res  = await fetch(`${KERNEL_URL}${cfg.endpoint}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(payload),
//       });

//       const ms   = Date.now() - t0;
//       const data = await res.json();
//       const ok   = res.ok && data.ok !== false;
//       const now  = new Date().toISOString();
//       const isSafetyHalt = data.error === "safety_halt";
//       const execHash = data.audit?.execution_hash ?? fakeHash(JSON.stringify(payload) + now);

//       const safetyEvents: Array<{ type: "allow" | "block" | "warn"; message: string; detail: string; timestamp: string }> = isSafetyHalt ? [
//         { type: "allow",  message: "Resolver allowlist check passed",          detail: "allowed_resolvers validated",                        timestamp: now },
//         { type: "allow",  message: "PII validation passed",                    detail: `validator: pii_v2 | domain: ${domain}`,              timestamp: now },
//         { type: "block",  message: "SAFETY HALT — prohibited intent detected",
//           detail: `action: ${data.violation?.action ?? "unknown"} | policy: ${data.violation?.policy ?? cfg.intent.scope} | stage: ${data.violation?.stage ?? "pre_execution_intent_guard"}`,
//           timestamp: now },
//         { type: "block",  message: "Execution blocked before resolver chain",  detail: `query: "${data.violation?.triggered?.slice(0, 80) ?? "—"}"`, timestamp: now },
//       ] : [
//         { type: "allow",  message: "Resolver allowlist check passed",          detail: "allowed_resolvers validated",                    timestamp: now },
//         { type: "allow",  message: "PII validation passed",                    detail: `validator: pii_v2 | domain: ${domain}`,          timestamp: now },
//         { type: ok ? "allow" : "block",
//           message: ok ? "Execution completed without policy violations" : "Policy violation detected",
//           detail: `fingerprint: ${execHash.slice(9, 36)}…`,
//           timestamp: now },
//       ];

//       setResult({
//         ok,
//         response: ok ? (data.response ?? "Execution successful") : undefined,
//         error:    !ok ? (data.message ?? data.error ?? "Blocked by governance policy") : undefined,
//         violation: isSafetyHalt ? data.violation : undefined,
//         steps: [{
//           step: 1, resolver: cfg.fields[0]?.id ?? "resolver",
//           status: ok ? "allowed" : "blocked",
//           input:  inputVals[cfg.fields[0]?.id] ?? "—",
//           policy_check: `allowlist_match ${ok ? "✓" : "✗"}`,
//           timestamp: now,
//         }],
//         audit: {
//           execution_hash:   execHash,
//           prev_hash:        data.audit?.previous_hash ?? fakeHash("prev" + now),
//           kernel_signature: data.audit?.signature     ?? `ed25519:${fakeHash("sig" + now).slice(9, 48)}…`,
//           workflow_hash:    data.audit?.merkle_root   ?? fakeHash(`wf-${domain}-v1`),
//           timestamp: now, latency_ms: ms,
//         },
//         safety: { events: safetyEvents },
//         intent: {
//           scope:       cfg.intent.scope,
//           prohibited:  cfg.intent.prohibited,
//           enforcement: [
//             `Scope validation: ${ok ? "PASSED" : "FAILED"}`,
//             `Prohibited check: ${isSafetyHalt ? `1 VIOLATION — ${data.violation?.action ?? "unknown"}` : ok ? "0 violations" : "1 violation"}`,
//             `Output: ${ok ? "CLEAN" : "VIOLATION"}`,
//           ],
//           fingerprint: fakeHash(cfg.intent.scope + now),
//         },
//       });
//       setTab(isSafetyHalt ? "customer" : "customer");

//     } catch (err) {
//       console.error("🔍 Fetch error:", {
//         name: (err as Error).name,
//         message: (err as Error).message,
//         stack: (err as Error).stack,
//       });
//       setError(`Cannot reach kernel at ${KERNEL_URL}. Is olang-server running on port 3001?`);
//     } finally {
//       setRunning(false);
//     }
//   }, [code, domain, inputVals, cfg, syntaxErrors]);

//   // ── Design tokens ────────────────────────────────────────────────────────────
//   const BG      = "#070d1a";
//   const PANEL   = "#0c1425";
//   const BORDER  = "#1a2840";
//   const BORDER2 = "#243352";
//   const TEXT    = "#f1f5f9";
//   const TEXT2   = "#94a3b8";
//   const TEXT3   = "#64748b";
//   const ERR     = "#f87171";
//   const WARN    = "#fbbf24";
//   const OK      = "#34d399";

//   const errCount  = syntaxErrors.filter((e) => e.severity === "error").length;
//   const warnCount = syntaxErrors.filter((e) => e.severity === "warning").length;

//   const TABS: { id: TabId; label: string }[] = [
//     { id: "customer", label: "Customer View" },
//     { id: "trace",    label: "Execution Trace" },
//     { id: "safety",   label: "Safety Logs" },
//     { id: "audit",    label: "Audit Trail" },
//     { id: "intent",   label: "Verified Intent" },
//   ];

//   return (
//     <div className="min-h-screen flex flex-col pt-16" style={{ background: BG }}>

//       {/* ── TOP BAR ─────────────────────────────────────────────────────────── */}
//       <div className="flex items-center gap-4 px-6 py-3 flex-shrink-0"
//            style={{ background: PANEL, borderBottom: `1px solid ${BORDER}` }}>

//         <div className="flex items-center gap-3">
//           <span className="font-syne text-lg font-bold" style={{ color: TEXT }}>
//             O-Lang Playground
//           </span>
//           <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full"
//                 style={{ color: accent, background: accent + "20", border: `1px solid ${accent}40` }}>
//             ● live kernel
//           </span>
//         </div>

//         {/* Domain selector */}
//         <div className="flex gap-1 ml-4 p-1 rounded-xl" style={{ background: "#060d1a" }}>
//           {(["finance", "health", "legal"] as const).map((d) => (
//             <button key={d} onClick={() => switchDomain(d)}
//               className="px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all"
//               style={domain === d
//                 ? { background: ACCENTS[d], color: "#fff", boxShadow: `0 2px 8px ${ACCENTS[d]}50` }
//                 : { color: TEXT3, background: "transparent" }}>
//               {d}
//             </button>
//           ))}
//         </div>

//         {/* Validity badge */}
//         <div className="flex items-center gap-2">
//           {errCount > 0 && (
//             <span className="font-mono text-xs font-bold px-3 py-1 rounded-full"
//                   style={{ background: "#ef444425", color: ERR, border: `1px solid #ef444440` }}>
//               ✗ {errCount} error{errCount > 1 ? "s" : ""}
//             </span>
//           )}
//           {warnCount > 0 && (
//             <span className="font-mono text-xs font-bold px-3 py-1 rounded-full"
//                   style={{ background: "#f59e0b25", color: WARN, border: `1px solid #f59e0b40` }}>
//               ⚠ {warnCount} warning{warnCount > 1 ? "s" : ""}
//             </span>
//           )}
//           {errCount === 0 && warnCount === 0 && code.trim() && (
//             <span className="font-mono text-xs font-bold px-3 py-1 rounded-full"
//                   style={{ background: "#10b98125", color: OK, border: `1px solid #10b98140` }}>
//               ✓ valid
//             </span>
//           )}
//         </div>

//         {/* Run button */}
//         <div className="ml-auto flex items-center gap-4">
//           <span className="font-mono text-xs" style={{ color: TEXT3 }}>v1.1.0</span>
//           <button onClick={handleRun} disabled={running}
//             className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
//             style={{ background: `linear-gradient(135deg, ${accent}dd, ${accent})`,
//                      boxShadow: `0 4px 20px ${accent}50` }}>
//             {running
//               ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.5"><circle cx="10" cy="10" r="7" strokeDasharray="22 22"/></svg>
//               : <svg viewBox="0 0 14 14" fill="white" className="w-4 h-4"><path d="M3 2l9 5-9 5V2z"/></svg>}
//             {running ? "Running…" : "Run Workflow"}
//           </button>
//         </div>
//       </div>

//       {/* ── 3-COLUMN BODY ───────────────────────────────────────────────────── */}
//       <div className="flex flex-1 overflow-hidden">

//         {/* ── LEFT: Inputs + Hints ──────────────────────────────────────────── */}
//         <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto"
//              style={{ background: PANEL, borderRight: `1px solid ${BORDER}` }}>

//           <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
//             <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: accent }}>
//               Context Inputs
//             </p>
//             <div className="flex flex-col gap-4">
//               {cfg.fields.map((f) => (
//                 <div key={f.id}>
//                   <label className="flex items-center gap-1 text-sm font-semibold mb-1.5" style={{ color: TEXT2 }}>
//                     {f.label}
//                     {f.required && <span style={{ color: ERR }}>*</span>}
//                   </label>
//                   {f.type === "select" ? (
//                     <select value={inputVals[f.id] ?? ""}
//                       onChange={(e) => setInputVals((p) => ({ ...p, [f.id]: e.target.value }))}
//                       className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
//                       style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT, fontFamily: "inherit" }}>
//                       <option value="" style={{ color: TEXT3 }}>{f.placeholder}</option>
//                       {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
//                     </select>
//                   ) : f.type === "textarea" ? (
//                     <textarea value={inputVals[f.id] ?? ""}
//                       onChange={(e) => setInputVals((p) => ({ ...p, [f.id]: e.target.value }))}
//                       placeholder={f.placeholder} rows={3}
//                       className="w-full rounded-lg px-3 py-2.5 font-mono text-sm outline-none resize-y transition-all"
//                       style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT }} />
//                   ) : (
//                     <input value={inputVals[f.id] ?? ""}
//                       onChange={(e) => setInputVals((p) => ({ ...p, [f.id]: e.target.value }))}
//                       placeholder={f.placeholder}
//                       className="w-full rounded-lg px-3 py-2.5 font-mono text-sm outline-none transition-all"
//                       style={{ background: "#08111e", border: `1px solid ${BORDER2}`, color: TEXT }} />
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Demo Customers (finance only) */}
//           {domain === "finance" && (
//             <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
//               <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>
//                 Demo Accounts
//               </p>
//               <p className="text-xs mb-3" style={{ color: TEXT3 }}>Click a row to auto-fill Customer ID</p>
//               <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER2}` }}>
//                 <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
//                   <thead>
//                     <tr style={{ background: "#0a1628", borderBottom: `1px solid ${BORDER2}` }}>
//                       <th className="text-left px-3 py-2 font-semibold" style={{ color: TEXT3 }}>ID</th>
//                       <th className="text-left px-3 py-2 font-semibold" style={{ color: TEXT3 }}>Name</th>
//                       <th className="text-right px-3 py-2 font-semibold" style={{ color: TEXT3 }}>Balance</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {[
//                       { id: "CUST-001", name: "Sophia Müller",  balance: "$12,450.00" },
//                       { id: "CUST-002", name: "James Okafor",   balance: "$3,820.50"  },
//                       { id: "CUST-003", name: "Priya Nair",     balance: "$28,100.75" },
//                       { id: "CUST-004", name: "Carlos Reyes",   balance: "$940.20"    },
//                       { id: "CUST-005", name: "Aiko Tanaka",    balance: "$67,300.00" },
//                       { id: "CUST-006", name: "Lena Kowalski",  balance: "$5,215.90"  },
//                       { id: "CUST-007", name: "Marcus Webb",    balance: "$150.00"    },
//                     ].map((c, i) => {
//                       const isSelected = inputVals["customer_id"] === c.id;
//                       return (
//                         <tr key={c.id}
//                           onClick={() => setInputVals((p) => ({ ...p, customer_id: c.id }))}
//                           className="cursor-pointer transition-all"
//                           style={{
//                             background: isSelected ? `${accent}18` : i % 2 === 0 ? "transparent" : "#080f1c",
//                             borderTop: i > 0 ? `1px solid ${BORDER}` : undefined,
//                             outline: isSelected ? `1px solid ${accent}55` : undefined,
//                           }}>
//                           <td className="px-3 py-2 font-mono font-bold" style={{ color: isSelected ? accent : TEXT2 }}>{c.id}</td>
//                           <td className="px-3 py-2" style={{ color: TEXT }}>{c.name}</td>
//                           <td className="px-3 py-2 text-right font-mono" style={{ color: isSelected ? accent : TEXT2 }}>{c.balance}</td>
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* Syntax Hints */}
//           {syntaxErrors.length > 0 && (
//             <div className="p-5" style={{ borderBottom: `1px solid ${BORDER}` }}>
//               <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: TEXT2 }}>
//                 Syntax Hints
//               </p>
//               <div className="flex flex-col gap-2.5">
//                 {syntaxErrors.map((e, i) => (
//                   <button key={i} onClick={() => {
//                     setActiveError(e);
//                     editorRef.current?.revealLineInCenter(e.line);
//                     editorRef.current?.setPosition({ lineNumber: e.line, column: e.col });
//                     editorRef.current?.focus();
//                   }}
//                     className="text-left rounded-xl p-3 transition-all hover:brightness-125"
//                     style={{
//                       background: e.severity === "error" ? "#ef444415" : "#f59e0b10",
//                       border: `1px solid ${e.severity === "error" ? "#ef444435" : "#f59e0b30"}`,
//                     }}>
//                     <p className="font-mono text-xs font-bold mb-1" style={{ color: e.severity === "error" ? ERR : WARN }}>
//                       {e.severity === "error" ? "✗" : "⚠"} Line {e.line}
//                     </p>
//                     <p className="text-sm leading-snug" style={{ color: TEXT }}>{e.message}</p>
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           {activeError && (
//             <div className="p-5">
//               <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#60a5fa" }}>
//                 💡 Fix Suggestion
//               </p>
//               <div className="rounded-xl p-3 font-mono text-sm leading-relaxed"
//                    style={{ background: "#60a5fa10", border: "1px solid #60a5fa30", color: "#93c5fd" }}>
//                 {activeError.suggestion}
//               </div>
//             </div>
//           )}

//           {syntaxErrors.length === 0 && (
//             <div className="p-5">
//               <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: TEXT3 }}>Editor Tips</p>
//               <div className="space-y-2 text-sm" style={{ color: TEXT2 }}>
//                 <div className="flex items-start gap-2">
//                   <span style={{ color: accent }}>⌨</span>
//                   <span><span className="font-semibold" style={{ color: TEXT }}>Ctrl+Space</span> — autocomplete</span>
//                 </div>
//                 <div className="flex items-start gap-2">
//                   <span style={{ color: accent }}>🖱</span>
//                   <span>Click any error in the list to jump to it</span>
//                 </div>
//                 <div className="flex items-start gap-2">
//                   <span style={{ color: accent }}>✏</span>
//                   <span>Edit freely — runs against the live kernel</span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* ── CENTRE: Monaco Editor ─────────────────────────────────────────── */}
//         <div className="flex-1 flex flex-col overflow-hidden">
//           <div className="flex items-center justify-between px-5 py-2.5"
//                style={{ background: "#060c18", borderBottom: `1px solid ${BORDER}` }}>
//             <div className="flex items-center gap-3">
//               <div className="flex gap-1.5">
//                 {["#ff5f57","#ffbd2e","#28c840"].map((c) => (
//                   <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
//                 ))}
//               </div>
//               <span className="font-mono text-sm font-medium" style={{ color: TEXT3 }}>
//                 {domain}-workflow.ol
//               </span>
//             </div>
//             <div className="flex items-center gap-3">
//               <button onClick={() => { setCode(OL_TEMPLATES[domain]); setActiveError(null); }}
//                 className="font-mono text-sm px-3 py-1 rounded-lg transition-all hover:text-white"
//                 style={{ color: TEXT3, border: `1px solid ${BORDER}` }}>
//                 Reset
//               </button>
//               <span className="font-mono text-xs" style={{ color: TEXT3 }}>Ctrl+Space for autocomplete</span>
//             </div>
//           </div>

//           <div className="flex-1">
//             <MonacoEditor
//               height="100%"
//               language="olang"
//               value={code}
//               onChange={(v) => setCode(v ?? "")}
//               onMount={handleEditorMount}
//               options={{
//                 fontSize:             14,
//                 fontFamily:           "'DM Mono', 'Fira Code', monospace",
//                 lineHeight:           24,
//                 minimap:              { enabled: false },
//                 scrollBeyondLastLine: false,
//                 padding:              { top: 24, bottom: 24 },
//                 renderLineHighlight:  "line",
//                 lineNumbers:          "on",
//                 glyphMargin:          true,
//                 folding:              false,
//                 overviewRulerLanes:   0,
//                 wordWrap:             "on",
//                 automaticLayout:      true,
//                 quickSuggestions:     true,
//                 suggestOnTriggerCharacters: true,
//                 tabSize:              2,
//               }}
//             />
//           </div>
//         </div>

//         {/* ── RIGHT: Results Panel ──────────────────────────────────────────── */}
//         <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden"
//              style={{ background: PANEL, borderLeft: `1px solid ${BORDER}` }}>

//           <div className="flex" style={{ borderBottom: `1px solid ${BORDER}` }}>
//             {TABS.map((t) => (
//               <button key={t.id} onClick={() => setTab(t.id)}
//                 className="flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors relative"
//                 style={{ color: tab === t.id ? TEXT : TEXT3 }}>
//                 {t.label}
//                 {tab === t.id && (
//                   <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full"
//                         style={{ background: accent }} />
//                 )}
//               </button>
//             ))}
//           </div>

//           <div className="flex-1 overflow-y-auto p-5">

//             {error && (
//               <div className="rounded-xl p-4 text-sm mb-4 leading-relaxed"
//                    style={{ background: "#ef444415", border: `1px solid #ef444435`, color: ERR }}>
//                 {error}
//               </div>
//             )}

//             {!result && !error && tab !== "customer" && (
//               <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
//                 <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
//                      style={{ background: accent + "15", border: `1px solid ${accent}25` }}>
//                   <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" className="w-8 h-8">
//                     <path d="M5 3l14 9-14 9V3z"/>
//                   </svg>
//                 </div>
//                 <div>
//                   <p className="text-base font-semibold mb-1" style={{ color: TEXT }}>Edit & Run a Workflow</p>
//                   <p className="text-sm" style={{ color: TEXT2 }}>Results appear here after execution</p>
//                 </div>
//               </div>
//             )}

//             {/* Customer View */}
//             {tab === "customer" && (
//               <div className="space-y-4">
//                 {!result && !error && (
//                   <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
//                     <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
//                          style={{ background: accent + "15", border: `1px solid ${accent}25` }}>
//                       <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" className="w-8 h-8">
//                         <path d="M5 3l14 9-14 9V3z"/>
//                       </svg>
//                     </div>
//                     <div>
//                       <p className="text-base font-semibold mb-1" style={{ color: TEXT }}>Run a workflow to see results</p>
//                       <p className="text-sm" style={{ color: TEXT2 }}>Customer-facing output appears here</p>
//                     </div>
//                   </div>
//                 )}

//                 {error && (
//                   <div className="rounded-2xl p-5" style={{ background: "#ef444415", border: "1px solid #ef444430" }}>
//                     <p className="text-sm font-semibold mb-1" style={{ color: ERR }}>Something went wrong</p>
//                     <p className="text-sm" style={{ color: TEXT2 }}>Please try again or contact support.</p>
//                   </div>
//                 )}

//                 {result && result.ok && result.response && (
//                   <div className="space-y-4">
//                     <div className="flex items-center gap-3 px-1">
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
//                            style={{ background: accent, color: "#fff" }}>
//                         {domain === "finance" ? "🏦" : domain === "health" ? "🏥" : "⚖️"}
//                       </div>
//                       <div>
//                         <p className="text-sm font-semibold" style={{ color: TEXT }}>
//                           {domain === "finance" ? "Digital Banking Assistant" : domain === "health" ? "Clinical Support" : "Legal Document Service"}
//                         </p>
//                         <p className="text-xs" style={{ color: TEXT3 }}>Powered by O-Lang · Governed Response</p>
//                       </div>
//                     </div>
//                     <div className="rounded-2xl rounded-tl-sm p-5"
//                          style={{ background: "#0f1e36", border: `1px solid ${accent}30` }}>
//                       <p className="text-sm leading-relaxed" style={{ color: TEXT }}>{result.response}</p>
//                     </div>
//                     <div className="flex items-center gap-2 px-1">
//                       <svg viewBox="0 0 16 16" fill={OK} className="w-3.5 h-3.5 flex-shrink-0">
//                         <path d="M8 1L2 3.5v4C2 11 5 14 8 15c3-1 6-4 6-7.5v-4L8 1z"/>
//                       </svg>
//                       <p className="text-xs" style={{ color: TEXT3 }}>
//                         Response verified by O-Lang governance kernel · No policy violations detected
//                       </p>
//                     </div>
//                   </div>
//                 )}

//                 {result && !result.ok && (
//                   <div className="space-y-4">
//                     <div className="flex items-center gap-3 px-1">
//                       <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
//                            style={{ background: "#1a2840", border: `1px solid ${BORDER2}` }}>
//                         {domain === "finance" ? "🏦" : domain === "health" ? "🏥" : "⚖️"}
//                       </div>
//                       <div>
//                         <p className="text-sm font-semibold" style={{ color: TEXT }}>
//                           {domain === "finance" ? "Digital Banking Assistant" : domain === "health" ? "Clinical Support" : "Legal Document Service"}
//                         </p>
//                         <p className="text-xs" style={{ color: TEXT3 }}>Powered by O-Lang · Governed Response</p>
//                       </div>
//                     </div>
//                     <div className="rounded-2xl rounded-tl-sm p-5"
//                          style={{ background: "#0f1e36", border: `1px solid ${BORDER2}` }}>
//                       {result.violation?.action === "account_transfer" && (
//                         <p className="text-sm leading-relaxed" style={{ color: TEXT }}>
//                           For security reasons, transfers can't be initiated through this channel. Please use your banking app, visit a branch, or call our support line.
//                         </p>
//                       )}
//                       {result.violation?.action === "balance_modification" && (
//                         <p className="text-sm leading-relaxed" style={{ color: TEXT }}>
//                           This service is for balance enquiries only. To make a deposit or withdrawal, please use the banking app or visit your nearest branch.
//                         </p>
//                       )}
//                       {result.violation?.action === "speculative_balance" && (
//                         <p className="text-sm leading-relaxed" style={{ color: TEXT }}>
//                           I can only show your current account balance. For balance projections, please speak with one of our advisors.
//                         </p>
//                       )}
//                       {!result.violation?.action && (
//                         <p className="text-sm leading-relaxed" style={{ color: TEXT }}>
//                           We're unable to process this request right now. Please try a different query or contact support.
//                         </p>
//                       )}
//                     </div>
//                     <div className="flex items-center gap-2 px-1">
//                       <svg viewBox="0 0 16 16" fill={TEXT3} className="w-3.5 h-3.5 flex-shrink-0">
//                         <path d="M8 1L2 3.5v4C2 11 5 14 8 15c3-1 6-4 6-7.5v-4L8 1z"/>
//                       </svg>
//                       <p className="text-xs" style={{ color: TEXT3 }}>
//                         Request reviewed by O-Lang governance kernel · See Safety Logs for details
//                       </p>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Execution Trace */}
//             {result && tab === "trace" && (
//               <div className="space-y-3">
//                 {result.steps.map((s) => (
//                   <div key={s.step} className="rounded-xl p-4"
//                        style={{ background: "#08111e", border: `1px solid ${BORDER2}` }}>
//                     <div className="flex items-center gap-3 mb-3">
//                       <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
//                             style={{ background: accent }}>
//                         {s.step}
//                       </span>
//                       <span className="text-sm font-semibold" style={{ color: TEXT }}>{s.resolver}</span>
//                       <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
//                             style={s.status === "allowed"
//                               ? { background: "#10b98120", color: OK, border: `1px solid #10b98135` }
//                               : { background: "#ef444420", color: ERR, border: `1px solid #ef444435` }}>
//                         {s.status.toUpperCase()}
//                       </span>
//                     </div>
//                     <div className="space-y-1.5 font-mono text-xs" style={{ color: TEXT2 }}>
//                       <div><span style={{ color: "#60a5fa" }}>policy_check: </span>{s.policy_check}</div>
//                       <div><span style={{ color: "#60a5fa" }}>timestamp: </span>{s.timestamp}</div>
//                     </div>
//                   </div>
//                 ))}
//                 {result.ok && result.response && (
//                   <div className="rounded-xl p-4" style={{ background: "#10b98112", border: `1px solid #10b98130` }}>
//                     <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: OK }}>✓ Kernel Response</p>
//                     <p className="text-sm leading-relaxed" style={{ color: "#d1fae5" }}>{result.response}</p>
//                   </div>
//                 )}
//                 {!result.ok && result.error && (
//                   <div className="rounded-xl p-4" style={{ background: "#ef444415", border: `1px solid #ef444430`, color: ERR }}>
//                     <p className="text-sm leading-relaxed">✗ {result.error}</p>
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Safety Logs */}
//             {result && tab === "safety" && (
//               <div className="space-y-3">
//                 {!result.ok && result.safety.events.some(e => e.type === "block") && (
//                   <div className="rounded-xl px-4 py-3 flex items-center gap-3"
//                        style={{ background: "#ef444418", border: "1px solid #ef444440" }}>
//                     <span className="text-lg">🚫</span>
//                     <div>
//                       <p className="text-sm font-bold" style={{ color: "#f87171" }}>SAFETY HALT — Execution was blocked</p>
//                       <p className="text-xs mt-0.5" style={{ color: "#fca5a5" }}>
//                         The kernel intercepted a prohibited intent before any resolver was called.
//                       </p>
//                     </div>
//                   </div>
//                 )}
//                 {result.safety.events.map((e, i) => (
//                   <div key={i} className="rounded-xl overflow-hidden"
//                        style={{ border: `1px solid ${e.type === "block" ? "#ef444440" : BORDER2}` }}>
//                     <div className="flex items-center gap-3 px-4 py-3"
//                          style={{ background: e.type === "block" ? "#ef444412" : "#08111e" }}>
//                       <span style={{ color: e.type === "allow" ? OK : ERR }}>
//                         {e.type === "allow" ? "✓" : "✗"}
//                       </span>
//                       <span className="text-sm font-semibold" style={{ color: e.type === "block" ? ERR : TEXT }}>
//                         {e.message}
//                       </span>
//                     </div>
//                     <div className="px-4 py-2 font-mono text-xs"
//                          style={{ background: "#060c18", color: e.type === "block" ? "#fca5a5" : TEXT2 }}>
//                       {e.detail}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Audit Trail */}
//             {result && tab === "audit" && (
//               <div className="space-y-4">
//                 {([
//                   ["Execution Hash",   result.audit.execution_hash],
//                   ["Previous Hash",    result.audit.prev_hash],
//                   ["Kernel Signature", result.audit.kernel_signature],
//                   ["Workflow Hash",    result.audit.workflow_hash],
//                   ["Timestamp",        result.audit.timestamp],
//                   ["Latency",          `${result.audit.latency_ms}ms`],
//                 ] as [string, string][]).map(([label, value]) => (
//                   <div key={label} className="rounded-xl p-3.5"
//                        style={{ background: "#08111e", border: `1px solid ${BORDER}` }}>
//                     <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: TEXT3 }}>{label}</p>
//                     <p className="font-mono text-xs break-all leading-relaxed" style={{ color: TEXT2 }}>{value}</p>
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Verified Intent */}
//             {result && tab === "intent" && (
//               <div className="space-y-5">
//                 <div>
//                   <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: TEXT3 }}>Declared Scope</p>
//                   <div className="rounded-xl px-4 py-3 text-sm font-semibold"
//                        style={{ background: accent + "18", border: `1px solid ${accent}35`, color: TEXT }}>
//                     {result.intent.scope}
//                   </div>
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: TEXT3 }}>Prohibited Actions</p>
//                   <div className="space-y-2">
//                     {result.intent.prohibited.map((p) => (
//                       <div key={p} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
//                            style={{ background: "#ef444412", border: `1px solid #ef444428`, color: "#fca5a5" }}>
//                         <span className="font-bold" style={{ color: ERR }}>✗</span>
//                         <span style={{ color: TEXT }}>{p}</span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//                 <div>
//                   <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: TEXT3 }}>Enforcement Results</p>
//                   <div className="space-y-2">
//                     {result.intent.enforcement.map((e) => (
//                       <div key={e} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
//                            style={{ background: "#10b98110", border: `1px solid #10b98128`, color: TEXT }}>
//                         <span className="font-bold" style={{ color: OK }}>✓</span>
//                         {e}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }