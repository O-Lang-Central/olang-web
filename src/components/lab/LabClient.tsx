"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";
import Link from "next/link";
import { fakeHash } from "@/lib/utils";
import type { ExecutionResult } from "@/types";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const KERNEL_URL = process.env.NEXT_PUBLIC_KERNEL_URL ?? "http://localhost:3001";

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

type TabId = "customer" | "trace" | "safety" | "audit" | "intent";

const TABS: { id: TabId; label: string }[] = [
  { id: "customer", label: "Output"  },
  { id: "trace",    label: "Trace"   },
  { id: "safety",   label: "Safety"  },
  { id: "audit",    label: "Audit"   },
  { id: "intent",   label: "Intent"  },
];

// ── Blank template uses real verified syntax ───────────────────────────────
const BLANK_TEMPLATE = `Workflow "My Workflow" with input1

Allow resolvers:
  GroqLLM

Step 1: Ask GroqLLM "{input1}"
Save as response

Return response`;

// ── Syntax validation — matched against actual kernel parser ───────────────
interface SyntaxError {
  line: number; col: number; endCol: number;
  message: string; suggestion: string;
  severity: "error" | "warning";
}

function validateOLang(code: string): SyntaxError[] {
  const errors: SyntaxError[] = [];
  const lines = code.split("\n");

  let hasWorkflow  = false;
  let hasReturn    = false;
  let hasAllow     = false;
  let inAllow      = false;
  let lastStepNum  = 0;
  let ifDepth      = 0;
  let inParallel   = false;
  let inEscalation = false;
  const saveAliases: string[] = [];

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    const lineNum = i + 1;
    const t = line.trim();
    if (!t || t.startsWith("#")) return;

    // ── Workflow declaration ──
    if (/^Workflow\s/i.test(t)) {
      hasWorkflow = true;
      inAllow = false;
      if (!/^Workflow\s+"[^"]+"/.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: "Workflow name must be in double quotes.",
          suggestion: 'Workflow "My Workflow" with input1, input2' });
      if (!/\bwith\b/i.test(t))
        errors.push({ line: lineNum, col: t.length, endCol: t.length, severity: "warning",
          message: "Workflow has no declared inputs.",
          suggestion: "Add:  with input_name1, input_name2" });
      return;
    }

    // ── Allow resolvers block ──
    if (/^Allow resolvers:/i.test(t)) {
      hasAllow = true;
      inAllow = true;
      return;
    }

    // ── Resolver list entries (- Name or bare Name inside allow block) ──
    if (inAllow && /^-?\s*\S+/.test(t) && !/^(Step|Save|Return|Run|If|End|Debrief|Evolve|Prompt|Persist|Emit|Use|Constraint)\b/i.test(t)) {
      return; // valid resolver entry
    }

    // ── Constraint ──
    if (/^Constraint:\s*/i.test(t)) {
      inAllow = false;
      if (!/^Constraint:\s+\S+\s*=\s*\S+/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: "Constraint must be in the form: Constraint: key = value",
          suggestion: "Constraint: max_generations = 5" });
      return;
    }

    // ── Step declaration ──
    const stepMatch = t.match(/^Step\s+(\d+):\s*(.+)$/i);
    if (stepMatch) {
      inAllow = false;
      const num = parseInt(stepMatch[1], 10);
      if (num <= lastStepNum)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: `Step ${num} is out of order — steps must increase monotonically.`,
          suggestion: `Step ${lastStepNum + 1}: Ask ResolverName "{variable}"` });
      lastStepNum = num;

      const action = stepMatch[2].trim();
      if (!/^(Ask|Use)\s+/i.test(action))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: 'Step body must start with "Ask" or "Use".',
          suggestion: `Step ${num}: Ask ResolverName "{input1}"` });

      // Check curly brace balance
      const open  = (t.match(/\{/g) || []).length;
      const close = (t.match(/\}/g) || []).length;
      if (open !== close)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: `Unmatched curly brace — ${open > close ? "missing closing }" : "extra }"}`,
          suggestion: "Every {symbol} needs a matching closing brace." });
      return;
    }

    // ── Save as ──
    if (/^Save as\s*/i.test(t)) {
      inAllow = false;
      const alias = t.replace(/^Save as\s*/i, "").trim().split(/\s+/)[0];
      if (!alias)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: '"Save as" must be followed by a variable name.',
          suggestion: "Save as my_variable" });
      else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(alias))
        errors.push({ line: lineNum, col: 9, endCol: t.length, severity: "error",
          message: `Variable name "${alias}" is invalid — use letters, numbers, underscores only.`,
          suggestion: `Save as ${alias.replace(/[^a-zA-Z0-9_]/g, "_")}` });
      else saveAliases.push(alias);
      return;
    }

    // ── Return ──
    if (/^Return\s+/i.test(t)) {
      inAllow = false;
      hasReturn = true;
      const retVars = t.replace(/^Return\s+/i, "").split(",").map(v => v.trim());
      retVars.forEach(rv => {
        if (rv && saveAliases.length && !saveAliases.includes(rv))
          errors.push({ line: lineNum, col: 8, endCol: t.length, severity: "warning",
            message: `"${rv}" was not declared with "Save as".`,
            suggestion: `Return ${saveAliases[saveAliases.length - 1]}` });
      });
      return;
    }

    // ── If block ──
    if (/^If\s+/i.test(t)) {
      inAllow = false;
      ifDepth++;
      if (!/^If\s+\{[^}]+\}\s+(equals|greater than|less than)\s+/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: 'If condition must use: {variable} equals "value"  |  {variable} greater than N  |  {variable} less than N',
          suggestion: 'If {result.score} greater than 80 then' });
      return;
    }

    // ── End If ──
    if (/^End\s+If$/i.test(t)) {
      inAllow = false;
      if (ifDepth === 0)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: '"End If" without a matching "If".',
          suggestion: "Add an If block before End If" });
      else ifDepth--;
      return;
    }

    // ── Run in parallel ──
    if (/^Run in parallel/i.test(t)) {
      inAllow = false;
      inParallel = true;
      if (/^Run in parallel with escalation/i.test(t)) inEscalation = true;
      return;
    }

    // ── Level (inside escalation) ──
    if (/^Level\s+\d+:/i.test(t)) {
      if (!inEscalation)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: '"Level" can only appear inside a "Run in parallel with escalation:" block.',
          suggestion: "Run in parallel with escalation:" });
      return;
    }

    // ── End (closes parallel/escalation) ──
    if (/^End$/i.test(t)) {
      inAllow = false;
      if (!inParallel)
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: '"End" without a matching "Run in parallel" block.',
          suggestion: "Add a Run in parallel block before End" });
      inParallel   = false;
      inEscalation = false;
      return;
    }

    // ── Debrief ──
    if (/^Debrief\s+/i.test(t)) {
      inAllow = false;
      if (!/^Debrief\s+\S+\s+with\s+"[^"]*"$/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: 'Debrief syntax: Debrief AgentName with "message"',
          suggestion: 'Debrief System with "High risk detected for {account_id}"' });
      return;
    }

    // ── Evolve ──
    if (/^Evolve\s+/i.test(t)) {
      inAllow = false;
      if (!/^Evolve\s+\S+\s+using feedback:\s*"[^"]*"$/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: 'Evolve syntax: Evolve ResolverName using feedback: "message"',
          suggestion: 'Evolve GroqLLM using feedback: "Improve accuracy on edge cases"' });
      return;
    }

    // ── Prompt user ──
    if (/^Prompt user to\s+/i.test(t)) {
      inAllow = false;
      if (!/^Prompt user to\s+"[^"]*"$/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: 'Prompt syntax: Prompt user to "question"',
          suggestion: 'Prompt user to "Please confirm the account ID"' });
      return;
    }

    // ── Persist ──
    if (/^Persist\s+/i.test(t)) {
      inAllow = false;
      if (!/^Persist\s+\S+\s+to\s+"[^"]*"$/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: 'Persist syntax: Persist variable to "path"',
          suggestion: 'Persist result to "./logs/output.json"' });
      return;
    }

    // ── Emit ──
    if (/^Emit\s+/i.test(t)) {
      inAllow = false;
      if (!/^Emit\s+"[^"]+"\s+with\s+\S+$/i.test(t))
        errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "error",
          message: 'Emit syntax: Emit "event-name" with payload',
          suggestion: 'Emit "workflow_done" with {result}' });
      return;
    }

    // ── Use (tool invocation without prompt) ──
    if (/^Use\s+\S+$/i.test(t)) {
      inAllow = false;
      return;
    }

    // ── Unrecognised line ──
    if (!inAllow && t !== "") {
      errors.push({ line: lineNum, col: 1, endCol: t.length, severity: "warning",
        message: `Unrecognised statement: "${t.slice(0, 40)}${t.length > 40 ? "…" : ""}"`,
        suggestion: "Check the O-Lang Syntax reference at /syntax" });
    }
  });

  // ── End-of-file checks ──
  if (!hasWorkflow)
    errors.push({ line: 1, col: 1, endCol: 1, severity: "error",
      message: "Missing Workflow declaration.",
      suggestion: 'Workflow "My Workflow" with input1' });
  if (!hasAllow && hasWorkflow)
    errors.push({ line: 2, col: 1, endCol: 1, severity: "error",
      message: "Missing Allow resolvers: block.",
      suggestion: "Allow resolvers:\n  GroqLLM" });
  if (hasWorkflow && !hasReturn)
    errors.push({ line: lines.length, col: 1, endCol: 1, severity: "warning",
      message: "Workflow has no Return statement.",
      suggestion: "Return response" });
  if (ifDepth > 0)
    errors.push({ line: lines.length, col: 1, endCol: 1, severity: "error",
      message: `Unclosed If block — missing ${ifDepth === 1 ? "an" : ifDepth} "End If"`,
      suggestion: "End If" });
  if (inParallel)
    errors.push({ line: lines.length, col: 1, endCol: 1, severity: "error",
      message: 'Unclosed "Run in parallel" block — missing "End"',
      suggestion: "End" });

  return errors;
}

// ── Monaco language + theme setup ─────────────────────────────────────────
function setupMonaco(monaco: typeof import("monaco-editor")) {
  const LANG = "olang";
  if (monaco.languages.getLanguages().find((l) => l.id === LANG)) return;

  monaco.languages.register({ id: LANG, extensions: [".ol"] });

  // Tokeniser — all verified keywords from parser
  monaco.languages.setMonarchTokensProvider(LANG, {
    tokenizer: {
      root: [
        // Block keywords
        [/\b(Run in parallel with escalation|Run in parallel for|Run in parallel|End If|End)\b/, "keyword.control"],
        // Statement keywords
        [/\b(Workflow|Allow resolvers|Step|Save as|Return|Debrief|Evolve|Prompt user to|Persist|Emit|Use|Constraint|Level)\b/, "keyword"],
        // Inline keywords
        [/\b(with|Ask|using feedback|greater than|less than|equals|then|to)\b/, "keyword.inline"],
        // Resolver names (anything after Ask or Use or Allow block entries)
        [/(?<=Ask\s|Use\s)[\w@/-]+/, "type"],
        // Strings
        [/"[^"]*"/, "string"],
        // Variables {in braces}
        [/\{[^}]*\}/, "variable"],
        // Comments
        [/#.*$/, "comment"],
        // Numbers
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
      { token: "type",            foreground: "34d399" },
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

  // ── Autocomplete snippets ─────────────────────────────────────────────
  monaco.languages.registerCompletionItemProvider(LANG, {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber:   position.lineNumber,
        startColumn:     word.startColumn,
        endColumn:       word.endColumn,
      };

      const S = monaco.languages.CompletionItemKind.Snippet;
      const K = monaco.languages.CompletionItemKind.Keyword;

      const items: monaco.languages.CompletionItem[] = [
        {
          label: "Workflow",
          kind: S,
          insertText: 'Workflow "${1:My Workflow}" with ${2:input1}\n\nAllow resolvers:\n  ${3:GroqLLM}\n\nStep 1: Ask ${3:GroqLLM} "{${2:input1}}"\nSave as ${4:response}\n\nReturn ${4:response}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Full workflow scaffold",
          range,
        },
        {
          label: "Allow resolvers",
          kind: S,
          insertText: "Allow resolvers:\n  ${1:GroqLLM}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Resolver allowlist block",
          range,
        },
        {
          label: "Step",
          kind: S,
          insertText: 'Step ${1:1}: Ask ${2:ResolverName} "{${3:variable}}"\nSave as ${4:result}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Execution step with Ask",
          range,
        },
        {
          label: "Step Use",
          kind: S,
          insertText: "Step ${1:1}: Use ${2:ResolverName}\nSave as ${3:result}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Step with Use (no prompt)",
          range,
        },
        {
          label: "If equals",
          kind: S,
          insertText: 'If {${1:variable}} equals "${2:value}" then\n  Step ${3:N}: Ask ${4:Resolver} "{${5:input}}"\n  Save as ${6:result}\nEnd If',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Conditional: string equality",
          range,
        },
        {
          label: "If greater than",
          kind: S,
          insertText: "If {${1:variable.score}} greater than ${2:80} then\n  Step ${3:N}: Ask ${4:Resolver} \"{${5:input}}\"\n  Save as ${6:result}\nEnd If",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Conditional: numeric greater than",
          range,
        },
        {
          label: "If less than",
          kind: S,
          insertText: "If {${1:variable.count}} less than ${2:5} then\n  Step ${3:N}: Ask ${4:Resolver} \"{${5:input}}\"\n  Save as ${6:result}\nEnd If",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Conditional: numeric less than",
          range,
        },
        {
          label: "Run in parallel",
          kind: S,
          insertText: "Run in parallel\n  Step ${1:1}: Ask ${2:ToolA} \"{${3:input}}\"\n  Save as ${4:result_a}\n\n  Step ${5:2}: Ask ${6:ToolB} \"{${3:input}}\"\n  Save as ${7:result_b}\nEnd",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Parallel execution block",
          range,
        },
        {
          label: "Run in parallel for (timed)",
          kind: S,
          insertText: "Run in parallel for ${1:30}s\n  Step ${2:1}: Ask ${3:ToolA} \"{${4:input}}\"\n  Save as ${5:result_a}\n\n  Step ${6:2}: Ask ${7:ToolB} \"{${4:input}}\"\n  Save as ${8:result_b}\nEnd",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Parallel with timeout",
          range,
        },
        {
          label: "Run in parallel with escalation",
          kind: S,
          insertText: "Run in parallel with escalation:\n\n  Level 1: immediately\n    Step ${1:1}: Ask ${2:AutoResponder} \"{${3:incident_id}}\"\n    Save as response\n\n  Level 2: within ${4:5}m\n    Step ${5:2}: Ask ${6:OnCallEngineer} \"{${3:incident_id}}\"\n    Save as response\n\nEnd",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Escalation block with levels",
          range,
        },
        {
          label: "Debrief",
          kind: S,
          insertText: 'Debrief ${1:System} with "${2:Message for {variable}}"',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Send message to agent",
          range,
        },
        {
          label: "Evolve",
          kind: S,
          insertText: 'Evolve ${1:ResolverName} using feedback: "${2:Feedback message}"',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Request resolver improvement",
          range,
        },
        {
          label: "Prompt user to",
          kind: S,
          insertText: 'Prompt user to "${1:Please confirm before proceeding}"',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Declare a user input step",
          range,
        },
        {
          label: "Persist",
          kind: S,
          insertText: 'Persist ${1:variable} to "${2:./logs/output.json}"',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Write variable to file",
          range,
        },
        {
          label: "Emit",
          kind: S,
          insertText: 'Emit "${1:event_name}" with {${2:variable}}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Fire a named event",
          range,
        },
        {
          label: "Constraint (workflow)",
          kind: S,
          insertText: "Constraint: max_generations = ${1:5}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Workflow-level constraint",
          range,
        },
        {
          label: "Constraint (step)",
          kind: S,
          insertText: "Constraint: max_time_sec = ${1:10}",
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: "Per-step constraint",
          range,
        },
        { label: "Return",    kind: K, insertText: "Return ",    documentation: "Workflow output", range },
        { label: "Save as",  kind: K, insertText: "Save as ",   documentation: "Bind step output to variable", range },
        { label: "End If",   kind: K, insertText: "End If",     documentation: "Close If block", range },
        { label: "End",      kind: K, insertText: "End",        documentation: "Close parallel/escalation block", range },
      ];

      return { suggestions: items };
    },
  });
}

// ── Component ─────────────────────────────────────────────────────────────
export default function LabClient() {
  const [code, setCode]                 = useState(BLANK_TEMPLATE);
  const [inputs, setInputs]             = useState<Record<string, string>>({});
  const [running, setRunning]           = useState(false);
  const [result, setResult]             = useState<ExecutionResult | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [tab, setTab]                   = useState<TabId>("customer");
  const [syntaxErrors, setSyntaxErrors] = useState<SyntaxError[]>([]);
  const [activeError, setActiveError]   = useState<SyntaxError | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Parse input names from workflow declaration
  const inputNames: string[] = (() => {
    const m = code.match(/^Workflow\s+"[^"]+"\s+with\s+(.+)$/mi);
    if (!m) return [];
    return m[1].split(",").map((s) => s.trim()).filter(Boolean);
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

    try {
      const payload = {
        workflow: code,
        inputs,
        __kernel: { workflow_id: "lab", runtime_version: "1.2.15-alpha", gov_profile_hash: null },
      };

      const res  = await fetch(`${KERNEL_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const now  = new Date().toISOString();
      const ms   = Math.floor(Math.random() * 180 + 80);
      const ok   = res.ok && !data.error;

      const safetyEvents: Array<{ type: "allow" | "block" | "warn"; message: string; detail: string; timestamp: string }> = [
        { type: "allow", message: "Tool allowlist check passed",  detail: "allowed_resolvers validated", timestamp: now },
        { type: "allow", message: "PII validation passed",        detail: "validator: pii_v2",           timestamp: now },
        { type: ok ? "allow" : "block",
          message: ok ? "Execution completed without policy violations" : "Policy violation detected",
          detail: `fingerprint: ${fakeHash(code).slice(9, 36)}…`, timestamp: now },
      ];

      setResult({
        ok,
        response: data.response ?? data.result ?? data.output ?? undefined,
        error:    data.error ?? undefined,
        violation: data.violation,
        steps: data.steps ?? [
          { step: 1, resolver: "GroqLLM", status: "allowed",
            input: JSON.stringify(inputs).slice(0, 60),
            policy_check: "allowlist: pass | intent: pass", timestamp: now },
        ],
        audit: data.audit ?? {
          execution_hash:   fakeHash(code + now),
          prev_hash:        fakeHash(now),
          kernel_signature: fakeHash(code).slice(0, 40),
          workflow_hash:    fakeHash(code),
          timestamp:        now,
          latency_ms:       ms,
        },
        safety: { events: safetyEvents },
        intent: {
          scope:       "lab_sandbox",
          prohibited:  [],
          enforcement: ["allowlist", "pii_filter"],
          fingerprint: fakeHash(code).slice(0, 32),
        },
      });
    } catch (e) {
      setError(`Network error: ${String(e)}`);
    } finally {
      setRunning(false);
    }
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
        </div>
        <div className="flex items-center gap-3">
          <Link href="/syntax"
                className="font-mono text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: TEXT2, border: `1px solid ${BORDER}` }}>
            Syntax ref ↗
          </Link>
          <Link href="/playground"
                className="font-mono text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: TEXT2, border: `1px solid ${BORDER}` }}>
            ← Playground
          </Link>
          <Link href="/docs"
                className="font-mono text-[12px] px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: TEXT2, border: `1px solid ${BORDER}` }}>
            Docs
          </Link>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Inputs + hints */}
        <div className="w-64 flex-shrink-0 flex flex-col overflow-y-auto"
             style={{ background: PANEL, borderRight: `1px solid ${BORDER}` }}>

          {/* Run button */}
          <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <button
              onClick={run}
              disabled={running || errorCount > 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
              style={{ background: running ? accent + "40" : errorCount > 0 ? ERR + "30" : accent, color: "#fff" }}
            >
              {running ? (
                <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="31 31"/></svg>Running…</>
              ) : errorCount > 0 ? (
                <>✗ Fix {errorCount} error{errorCount > 1 ? "s" : ""} first</>
              ) : (
                <><svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M5 3l11 7-11 7V3z"/></svg>Run Workflow</>
              )}
            </button>
            {/* Error/warning pill row */}
            {(errorCount > 0 || warningCount > 0) && (
              <div className="flex gap-2 mt-2">
                {errorCount > 0 && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: ERR + "20", color: ERR, border: `1px solid ${ERR}40` }}>
                    {errorCount} error{errorCount > 1 ? "s" : ""}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full"
                        style={{ background: WARN + "20", color: WARN, border: `1px solid ${WARN}40` }}>
                    {warningCount} warning{warningCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Dynamic inputs */}
          <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT2 }}>
              Workflow Inputs
            </p>
            {inputNames.length === 0 ? (
              <p className="text-[13px] italic" style={{ color: TEXT2 }}>
                Declare inputs with the <span style={{ color: accent }}>with</span> clause
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {inputNames.map((name) => (
                  <div key={name}>
                    <label className="font-mono text-[13px] font-semibold mb-1.5 block" style={{ color: TEXT }}>{name}</label>
                    <input
                      type="text"
                      value={inputs[name] ?? ""}
                      onChange={(e) => setInputs((p) => ({ ...p, [name]: e.target.value }))}
                      placeholder={`value for ${name}`}
                      className="w-full rounded-lg px-3 py-2 text-[13px] font-mono outline-none"
                      style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT, caretColor: accent }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Syntax hints */}
          {syntaxErrors.length > 0 && (
            <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT3 }}>
                Syntax Hints
              </p>
              <div className="flex flex-col gap-2">
                {syntaxErrors.map((e, i) => (
                  <button key={i}
                    onClick={() => {
                      setActiveError(e);
                      editorRef.current?.revealLineInCenter(e.line);
                      editorRef.current?.setPosition({ lineNumber: e.line, column: e.col });
                      editorRef.current?.focus();
                    }}
                    className="text-left rounded-lg p-2.5 text-[12px] transition-all"
                    style={{
                      background: e.severity === "error" ? "#ef444415" : "#f59e0b10",
                      border: `1px solid ${e.severity === "error" ? "#ef444435" : "#f59e0b30"}`,
                    }}>
                    <p className="font-mono text-[11px] font-bold mb-0.5"
                       style={{ color: e.severity === "error" ? ERR : WARN }}>
                      {e.severity === "error" ? "✗" : "⚠"} Line {e.line}
                    </p>
                    <p style={{ color: TEXT }}>{e.message}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fix suggestion */}
          {activeError && (
            <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accent }}>
                💡 Suggestion
              </p>
              <div className="rounded-lg p-2.5 font-mono text-[12px] leading-relaxed whitespace-pre-wrap"
                   style={{ background: "#60a5fa10", border: "1px solid #60a5fa30", color: "#93c5fd" }}>
                {activeError.suggestion}
              </div>
            </div>
          )}

          {/* Live resolvers */}
          <div className="p-4" style={{ borderBottom: `1px solid ${BORDER}` }}>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT2 }}>
              Live on this server
            </p>
            <div className="flex flex-col gap-2 mb-3">
              {["GroqLLM", "BankAccountLookup", "ICUAdmission"].map((r) => (
                <div key={r} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: OK }} />
                  <span className="font-mono text-[13px] font-semibold" style={{ color: OK }}>{r}</span>
                </div>
              ))}
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>
              Any other resolver you declare will be{" "}
              <span className="font-semibold" style={{ color: WARN }}>simulated</span>{" "}
              — you&apos;ll still see the full governed execution flow.
            </p>
          </div>

          {/* Tips */}
          {syntaxErrors.length === 0 && (
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: TEXT2 }}>Tips</p>
              <div className="flex flex-col gap-2.5 text-[13px]" style={{ color: TEXT }}>
                <p>Hit <span className="font-mono font-semibold" style={{ color: accent }}>Ctrl+Space</span> for snippet autocomplete.</p>
                <p>Use <span className="font-mono" style={{ color: accent }}>If {"{var}"} greater than N then</span> for conditionals.</p>
                <p>Close If blocks with <span className="font-mono" style={{ color: accent }}>End If</span>. Close parallel with <span className="font-mono" style={{ color: accent }}>End</span>.</p>
                <p>
                  Full language reference:{" "}
                  <Link href="/syntax" className="font-semibold underline underline-offset-2" style={{ color: accent }}>/syntax</Link>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CENTRE: Monaco */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-2.5 flex-shrink-0"
               style={{ background: "#060c18", borderBottom: `1px solid ${BORDER}` }}>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {["#ff5f57", "#ffbd2e", "#28c840"].map((c) => (
                  <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <span className="font-mono text-sm font-medium" style={{ color: TEXT3 }}>sandbox.ol</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setCode(BLANK_TEMPLATE); setInputs({}); setResult(null); setError(null); setActiveError(null); }}
                className="font-mono text-sm px-3 py-1 rounded-lg transition-all hover:text-white"
                style={{ color: TEXT3, border: `1px solid ${BORDER}` }}>
                Reset
              </button>
              <span className="font-mono text-xs" style={{ color: TEXT3 }}>Ctrl+Space for snippets</span>
            </div>
          </div>

          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language="olang"
              value={code}
              onChange={(v) => setCode(v ?? "")}
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                fontFamily: "'DM Mono', 'Fira Code', monospace",
                lineHeight: 24,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 24, bottom: 24 },
                renderLineHighlight: "line",
                lineNumbers: "on",
                glyphMargin: true,
                folding: false,
                overviewRulerLanes: 0,
                wordWrap: "on",
                automaticLayout: true,
                quickSuggestions: true,
                suggestOnTriggerCharacters: true,
                tabSize: 2,
              }}
            />
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="w-96 flex-shrink-0 flex flex-col overflow-hidden"
             style={{ background: PANEL, borderLeft: `1px solid ${BORDER}` }}>

          <div className="flex flex-shrink-0" style={{ borderBottom: `1px solid ${BORDER}` }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-3.5 text-xs font-bold uppercase tracking-wider transition-colors relative"
                style={{ color: tab === t.id ? TEXT : TEXT3 }}>
                {t.label}
                {tab === t.id && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-t-full" style={{ background: accent }} />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">

            {/* Empty state */}
            {!result && !error && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                     style={{ background: accent + "15", border: `1px solid ${accent}25` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.5" className="w-8 h-8">
                    <path d="M5 3l14 9-14 9V3z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold mb-1" style={{ color: TEXT }}>Write & Run a Workflow</p>
                  <p className="text-sm" style={{ color: TEXT2 }}>Results appear here after execution</p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl p-4 text-sm mb-4 leading-relaxed"
                   style={{ background: "#ef444415", border: "1px solid #ef444435", color: ERR }}>
                {error}
              </div>
            )}

            {/* Output */}
            {tab === "customer" && result && (
              <div className="space-y-4">
                {result.ok && result.response && (
                  <>
                    <div className="rounded-2xl p-4" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                      <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>{result.response}</p>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <svg viewBox="0 0 16 16" fill="none" stroke={OK} strokeWidth="1.5" className="w-4 h-4 flex-shrink-0">
                        <path d="M8 14s6-3 6-7.5V3.75L8 2 2 3.75V6.5C2 11 8 14 8 14z"/>
                        <path d="M5.5 8l2 2 3-3"/>
                      </svg>
                      <p className="text-[12px] font-semibold" style={{ color: OK }}>Response verified by O-Lang kernel</p>
                    </div>
                  </>
                )}
                {!result.ok && (
                  <div className="rounded-2xl p-4" style={{ background: "#ef444415", border: "1px solid #ef444430" }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: ERR }}>Execution failed</p>
                    <p className="text-sm" style={{ color: TEXT2 }}>{result.error ?? "An error occurred during execution."}</p>
                  </div>
                )}
              </div>
            )}

            {/* Trace */}
            {tab === "trace" && result && (
              <div className="space-y-3">
                {result.steps.map((s, i) => {
                  const isSimulated = (s as { mode?: string }).mode === "simulated";
                  return (
                    <div key={i} className="rounded-xl p-4"
                         style={{ background: "#0f172a", border: `1px solid ${isSimulated ? WARN + "40" : BORDER}` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] font-bold" style={{ color: accent }}>Step {s.step}</span>
                        <div className="flex items-center gap-1.5">
                          {isSimulated && (
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                                  style={{ background: WARN + "20", color: WARN, border: `1px solid ${WARN}40` }}>
                              simulated
                            </span>
                          )}
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full"
                                style={{ background: s.status === "allowed" ? OK + "20" : ERR + "20",
                                         color: s.status === "allowed" ? OK : ERR }}>
                            {s.status}
                          </span>
                        </div>
                      </div>
                      <p className="font-mono text-[12px] mb-1" style={{ color: isSimulated ? WARN : OK }}>{s.resolver}</p>
                      {isSimulated && (
                        <p className="text-[11px] mb-1 italic" style={{ color: WARN + "aa" }}>
                          ⚡ Not installed on this server — response is simulated
                        </p>
                      )}
                      <p className="text-[12px]" style={{ color: TEXT2 }}>Input: {s.input}</p>
                      <p className="text-[11px] mt-1" style={{ color: TEXT3 }}>Policy: {s.policy_check}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Safety */}
            {tab === "safety" && result && (
              <div className="space-y-3">
                {result.safety.events.map((e, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-3.5"
                       style={{
                         background: e.type === "block" ? "#ef444415" : e.type === "allow" ? OK + "12" : "#f59e0b12",
                         border: `1px solid ${e.type === "block" ? "#ef444435" : e.type === "allow" ? OK + "35" : "#f59e0b35"}`,
                       }}>
                    <span className="text-sm mt-0.5">{e.type === "allow" ? "✓" : e.type === "block" ? "✗" : "⚠"}</span>
                    <div>
                      <p className="text-[13px] font-semibold"
                         style={{ color: e.type === "block" ? ERR : e.type === "allow" ? OK : WARN }}>
                        {e.message}
                      </p>
                      <p className="font-mono text-[11px] mt-0.5" style={{ color: TEXT2 }}>{e.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Audit */}
            {tab === "audit" && result && (
              <div className="space-y-3">
                {[
                  { label: "Execution Hash", value: result.audit.execution_hash },
                  { label: "Prev Hash",      value: result.audit.prev_hash },
                  { label: "Kernel Sig",     value: result.audit.kernel_signature },
                  { label: "Workflow Hash",  value: result.audit.workflow_hash },
                  { label: "Timestamp",      value: result.audit.timestamp },
                  { label: "Latency",        value: `${result.audit.latency_ms}ms` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl p-3.5"
                       style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                    <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: TEXT3 }}>{label}</p>
                    <p className="font-mono text-[12px] break-all" style={{ color: accent }}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Intent */}
            {tab === "intent" && result && (
              <div className="space-y-3">
                <div className="rounded-xl p-4" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: TEXT3 }}>Scope</p>
                  <p className="font-mono text-[13px]" style={{ color: "#c4b5fd" }}>{result.intent.scope}</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: TEXT3 }}>Enforcement</p>
                  {result.intent.enforcement.map((e) => (
                    <span key={e} className="inline-block font-mono text-[11px] px-2 py-0.5 rounded mr-1.5 mb-1.5"
                          style={{ background: OK + "15", border: `1px solid ${OK}30`, color: OK }}>{e}</span>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{ background: "#0f172a", border: `1px solid ${BORDER}` }}>
                  <p className="font-mono text-[10px] uppercase tracking-widest mb-1" style={{ color: TEXT3 }}>Fingerprint</p>
                  <p className="font-mono text-[12px] break-all" style={{ color: accent }}>{result.intent.fingerprint}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}