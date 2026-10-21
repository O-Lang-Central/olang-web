"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Simple inline icons to avoid extra dependencies
const Icons = {
  Sparkles: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Copy: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  Alert: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Download: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
};

export default function GenerateWorkflowPage() {
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Fetch available tools on mount to show user what the LLM is grounded in
  useEffect(() => {
    // ✅ UPDATED: Now uses the Next.js API proxy
    fetch("/api/tools")
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setAvailableTools(data.tools.map((t: any) => t.name));
        }
      })
      .catch(() => {
        // Silently fail if server isn't running locally during dev
      });
  }, []);

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // ✅ UPDATED: Now uses the Next.js API proxy
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error_code || "Failed to generate workflow");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result?.ol) {
      navigator.clipboard.writeText(result.ol);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (result?.ol) {
      const blob = new Blob([result.ol], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "workflow.ol";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-[5%] py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Icons.Sparkles />
            </div>
            <h1 className="font-syne text-xl font-bold text-slate-100">NL-to-OL Generator</h1>
          </div>
          <div className="flex items-center gap-2">
            {availableTools.length > 0 && (
              <span className="font-mono text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full">
                Grounded in: {availableTools.join(", ")}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-[5%] py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          
          {/* Left Panel: Input */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex-1 flex flex-col">
              <label className="font-syne text-sm font-semibold text-slate-300 mb-2">
                Describe your workflow
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Analyze transaction history for anomalies and generate a risk score, then notify the compliance team via Telegram."
                className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-[14px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none font-mono leading-relaxed"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !description.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-950 bg-blue-400 rounded-lg hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-slate-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icons.Sparkles />
                      Generate Workflow
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error State */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3"
                >
                  <div className="text-red-400 mt-0.5"><Icons.Alert /></div>
                  <div>
                    <h3 className="text-sm font-semibold text-red-400 mb-1">Generation Failed</h3>
                    <p className="text-sm text-red-300/80">{error}</p>
                    <p className="text-xs text-red-400/60 mt-2 font-mono">Tip: Try being more specific about the tools or steps required.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Panel: Output */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
            {/* Output Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/50">
              <span className="font-mono text-xs text-slate-500 uppercase tracking-wider">Generated .ol Workflow</span>
              {result && (
                <div className="flex items-center gap-2">
                  <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors" title="Copy to clipboard">
                    {copied ? <span className="text-emerald-400"><Icons.Check /></span> : <Icons.Copy />}
                  </button>
                  <button onClick={handleDownload} className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors" title="Download .ol file">
                    <Icons.Download />
                  </button>
                </div>
              )}
            </div>

            {/* Output Body */}
            <div className="flex-1 relative bg-slate-950 overflow-auto">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-400 rounded-full animate-spin" />
                  <p className="text-sm text-slate-500 font-mono animate-pulse">Composing governed workflow...</p>
                </div>
              ) : result ? (
                <div className="h-full flex flex-col">
                  {/* Validation Badges */}
                  <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-800 bg-emerald-500/5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <Icons.Check /> Valid
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Parser Validated
                    </span>
                    <span className="ml-auto text-[11px] font-mono text-slate-500">
                      {result.attempts} attempt(s) · {result.provider}/{result.model}
                    </span>
                  </div>
                  
                  {/* Code Block */}
                  <pre className="flex-1 p-5 font-mono text-[13px] leading-relaxed text-slate-300 overflow-auto">
                    <code>{result.ol}</code>
                  </pre>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                    <Icons.Sparkles />
                  </div>
                  <p className="text-sm font-mono">Your governed workflow will appear here</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}