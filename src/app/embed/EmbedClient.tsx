// app/embed/EmbedClient.tsx
'use client';

import { useState, useRef, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_KERNEL_URL || 'http://localhost:3001';

const AVATAR_OPTIONS = [
  '🤖', '🧠', '✨', '🔮', '🛡️', '⚡', '🌟', '💬',
  '🎯', '🔍', '🧭', '🤝', '🌱', '🚀', '🔐', '💡'
];

function detectUserLocale(): string {
  if (typeof navigator !== 'undefined') return navigator.language || 'en-US';
  return 'en-US';
}
const DEFAULT_LOCALE = detectUserLocale();

function mockHash(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return Math.abs(h).toString(16).padStart(8, 'a') + 'f3c2e1b0';
}

const getMockResponse = (userMessage: string, welcome: string, avatar: string) => {
  const lower = userMessage.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey'))
    return `${avatar} ${welcome}`;
  if (lower.includes('help'))
    return "I'm a governed AI assistant powered by O-Lang. I can answer questions from your docs with full policy enforcement and a cryptographic audit trail on every response.";
  if (lower.includes('olang') || lower.includes('o-lang') || lower.includes('govern'))
    return "O-Lang ensures every AI response is:\n\n⬡ Auditable — cryptographic hash per execution\n↺ Replayable — full workflow trace stored\n✓ Verifiable — Merkle + RSA signature check\n\nLearn more at olang.cloud";
  return `${avatar} In a live deployment, this response would carry a kernel-signed execution hash, be stored in an immutable audit log, and be verifiable on demand. Every word — governed.`;
};

// ── UPDATED: GovernanceBadges matching embed.js v2.1.1 EXACTLY ─────────────
function GovernanceBadges({ hash, sources = [], audit = null, index = 0 }: { 
  hash: string; 
  sources?: Array<{ filename: string; score: number }>; 
  audit?: any; 
  index?: number 
}) {
  const [verifyState, setVerifyState] = useState<'idle' | 'checking' | 'verified'>('idle');
  const [auditOpen, setAuditOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  
  const handleVerify = () => {
    setVerifyState('checking');
    setTimeout(() => setVerifyState('verified'), 900 + index * 120);
  };

  const copyHash = async (fullHash: string, el: HTMLElement) => {
    try {
      await navigator.clipboard.writeText(fullHash);
      setCopiedHash(fullHash);
      const tip = document.createElement('span');
      tip.className = 'olang-copy-tip';
      tip.textContent = 'copied';
      el.appendChild(tip);
      setTimeout(() => {
        tip.remove();
        setCopiedHash(null);
      }, 1500);
    } catch {}
  };

  const shortHash = (h: string, n = 16) => h ? h.slice(0, n) + '…' : '—';

  return (
    <div className="olang-trust-bar">
      {/* Grounded pill — only when we have sources */}
      {sources.length > 0 && (
        <span className="olang-grounded-pill" title={`Sourced from ${sources.length} document${sources.length !== 1 ? 's' : ''}`}>
          <span className="olang-grounded-dot" />
          Grounded
        </span>
      )}

      {/* Source chips (max 3) */}
      {sources.slice(0, 3).map((src, i) => (
        <span key={i} className="olang-source-chip" title={`${src.filename} — ${src.score}% relevance`}>
          📄 {src.filename}&thinsp;<span className="olang-source-score">{src.score}%</span>
        </span>
      ))}
      {sources.length > 3 && (
        <span className="olang-source-chip" style={{ color: '#9ca3af' }}>
          +{sources.length - 3} more
        </span>
      )}

      {/* Audit toggle — whenever audit data is present */}
      {audit && (
        <>
          <button 
            className="olang-audit-btn"
            onClick={() => setAuditOpen(!auditOpen)}
            title="View cryptographic audit trail"
          >
            audit <span className={`olang-chevron ${auditOpen ? 'open' : ''}`}>▾</span>
          </button>

          {/* Audit panel (collapsible) — matches embed.js structure exactly */}
          {auditOpen && (
            <div className={`olang-audit-panel ${auditOpen ? 'open' : ''}`}>
              <div className="olang-audit-inner">
                <div className="olang-audit-section">execution</div>
                <div className="olang-audit-row">
                  <span className="olang-audit-key">timestamp</span>
                  <span className="olang-audit-val">{new Date().toLocaleString()}</span>
                </div>
                <div className="olang-audit-row">
                  <span className="olang-audit-key">exec_hash</span>
                  <span 
                    className="olang-audit-val purple olang-hash-val"
                    data-full={hash}
                    title="Click to copy"
                    onClick={(e) => copyHash(hash, e.currentTarget)}
                  >
                    {shortHash(hash)}
                    {copiedHash === hash && <span className="olang-copy-tip">copied</span>}
                  </span>
                </div>
                <div className="olang-audit-row">
                  <span className="olang-audit-key">kernel</span>
                  <span className="olang-audit-val green">olang-kernel v1.2.20-α</span>
                </div>

                <div className="olang-audit-section">chain</div>
                <div className="olang-audit-row">
                  <span className="olang-audit-key">merkle_root</span>
                  <span 
                    className="olang-audit-val purple olang-hash-val"
                    data-full={audit.merkle_root || hash}
                    title="Click to copy"
                    onClick={(e) => copyHash(audit.merkle_root || hash, e.currentTarget)}
                  >
                    {shortHash(audit.merkle_root || hash)}
                    {copiedHash === (audit.merkle_root || hash) && <span className="olang-copy-tip">copied</span>}
                  </span>
                </div>
                <div className="olang-audit-row">
                  <span className="olang-audit-key">policy_hash</span>
                  <span 
                    className="olang-audit-val purple olang-hash-val"
                    data-full={audit.governance_profile_hash || hash}
                    title="Click to copy"
                    onClick={(e) => copyHash(audit.governance_profile_hash || hash, e.currentTarget)}
                  >
                    {shortHash(audit.governance_profile_hash || hash)}
                    {copiedHash === (audit.governance_profile_hash || hash) && <span className="olang-copy-tip">copied</span>}
                  </span>
                </div>

                <div className="olang-audit-section">integrity</div>
                <span className={`olang-chain-badge ${audit.integrity?.valid !== false ? 'ok' : 'fail'}`}>
                  {audit.integrity?.valid !== false ? '✓ audit chain intact' : '✗ chain broken'}
                </span>

                <div className="olang-audit-section">confirm</div>
                <button 
                  className="olang-verify-btn"
                  onClick={handleVerify}
                  disabled={verifyState !== 'idle'}
                >
                  {verifyState === 'idle' ? '✦ confirm this response' : 
                   verifyState === 'checking' ? '⟳ confirming…' : '✓ confirmed'}
                </button>

                {/* Verify result display */}
                {verifyState !== 'idle' && (
                  <div className={`olang-verify-result ${verifyState === 'verified' ? 'ok' : 'fail'}`} style={{ display: 'block' }}>
                    {verifyState === 'verified' ? (
                      <>
                        <div style={{ marginBottom: '5px', fontWeight: 600, color: '#34d399' }}>
                          ✓ Response confirmed
                        </div>
                        <div style={{ color: '#94a3b8', lineHeight: 1.6 }}>
                          <div><span style={{ color: '#64748b' }}>answered&nbsp;&nbsp;</span>{new Date().toLocaleString()}</div>
                          <div><span style={{ color: '#64748b' }}>session&nbsp;&nbsp;&nbsp;</span>—</div>
                          <div style={{ marginTop: '4px', padding: '5px 7px', background: '#1e293b', borderRadius: '5px', color: '#94a3b8', fontSize: '0.62rem', lineHeight: 1.5 }}>
                            "{getMockResponse('test', 'Welcome', '🤖').substring(0, 60)}..."
                          </div>
                        </div>
                      </>
                    ) : (
                      'Verification failed'
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── CODE SNIPPETS PANEL ──────────────────────────────────────────────────────
type Framework = 'react' | 'nextjs' | 'typescript' | 'vue' | 'wordpress' | 'html';

const FRAMEWORK_TABS: { id: Framework; label: string; icon: string }[] = [
  { id: 'react',      label: 'React',      icon: '⚛️' },
  { id: 'nextjs',     label: 'Next.js',    icon: '▲' },
  { id: 'typescript', label: 'TypeScript', icon: '🔷' },
  { id: 'vue',        label: 'Vue',        icon: '💚' },
  { id: 'wordpress',  label: 'WordPress',  icon: '📘' },
  { id: 'html',       label: 'HTML',       icon: '🌐' },
];

function getSnippets(embedCode: string, apiUrl: string, botId: string, theme: string, welcome: string, position: string, avatar: string, locale: string) {
  return {

    react: `// OLangChat.jsx
import { useEffect } from 'react';

export default function OLangChat() {
  useEffect(() => {
    if (document.querySelector('script[data-olang]')) return;

    const script = document.createElement('script');
    script.src = '${apiUrl}/embed.js';
    script.setAttribute('data-olang', 'true');
    script.setAttribute('data-api-url', '${apiUrl}');
    script.setAttribute('data-bot-id', '${botId || 'your-bot-id'}');
    script.setAttribute('data-theme', '${theme}');
    script.setAttribute('data-welcome', '${welcome}');
    script.setAttribute('data-position', '${position}');
    script.setAttribute('data-avatar', '${avatar}');
    script.setAttribute('data-locale', '${locale}');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.querySelector('script[data-olang]')?.remove();
      document.getElementById('olang-chatbot-widget')?.remove();
    };
  }, []);

  return null; // widget mounts itself into the DOM
}

// Usage — add once anywhere in your app:
// import OLangChat from './OLangChat';
// <OLangChat />`,

    nextjs: `// app/components/OLangChat.tsx
'use client';

import Script from 'next/script';

export default function OLangChat() {
  return (
    <Script
      src="${apiUrl}/embed.js"
      strategy="lazyOnload"
      data-api-url="${apiUrl}"
      data-bot-id="${botId || 'your-bot-id'}"
      data-theme="${theme}"
      data-welcome="${welcome}"
      data-position="${position}"
      data-avatar="${avatar}"
      data-locale="${locale}"
    />
  );
}

// app/layout.tsx — add to root layout:
// import OLangChat from '@/components/OLangChat';
//
// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body>
//         {children}
//         <OLangChat />   ← renders on every page
//       </body>
//     </html>
//   );
// }`,

    typescript: `// OLangChat.tsx
import { useEffect } from 'react';

interface OLangChatProps {
  apiUrl?:   string;
  botId:     string;
  theme?:    'purple' | 'cyan' | 'green' | 'dark';
  welcome?:  string;
  position?: 'bottom-right' | 'bottom-left';
  avatar?:   string;
  locale?:   string;
}

// Extend Window to expose the OlangEmbed API
declare global {
  interface Window {
    OlangEmbed?: {
      open:         () => void;
      close:        () => void;
      send:         (message: string) => void;
      getSessionId: () => string;
    };
  }
}

export default function OLangChat({
  apiUrl   = '${apiUrl}',
  botId    = '${botId || 'your-bot-id'}',
  theme    = '${theme}',
  welcome  = '${welcome}',
  position = '${position}',
  avatar   = '${avatar}',
  locale   = '${locale}',
}: OLangChatProps) {

  useEffect(() => {
    if (document.querySelector('script[data-olang]')) return;

    const script = document.createElement('script');
    script.src = \`\${apiUrl}/embed.js\`;
    script.setAttribute('data-olang',    'true');
    script.setAttribute('data-api-url',  apiUrl);
    script.setAttribute('data-bot-id',   botId);
    script.setAttribute('data-theme',    theme);
    script.setAttribute('data-welcome',  welcome);
    script.setAttribute('data-position', position);
    script.setAttribute('data-avatar',   avatar);
    script.setAttribute('data-locale',   locale);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.querySelector('script[data-olang]')?.remove();
      document.getElementById('olang-chatbot-widget')?.remove();
    };
  }, [apiUrl, botId, theme, welcome, position, avatar, locale]);

  return null;
}

// Programmatic control (optional):
// window.OlangEmbed?.open();
// window.OlangEmbed?.send('What accounts do you offer?');
// const sid = window.OlangEmbed?.getSessionId();`,

    vue: `<!-- OLangChat.vue -->
<template>
  <!-- Widget mounts itself into the DOM — no template needed -->
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const props = withDefaults(defineProps<{
  apiUrl?:   string;
  botId:     string;
  theme?:    string;
  welcome?:  string;
  position?: string;
  avatar?:   string;
  locale?:   string;
}>(), {
  apiUrl:   '${apiUrl}',
  botId:    '${botId || 'your-bot-id'}',
  theme:    '${theme}',
  welcome:  '${welcome}',
  position: '${position}',
  avatar:   '${avatar}',
  locale:   '${locale}',
});

let scriptEl: HTMLScriptElement | null = null;

onMounted(() => {
  if (document.querySelector('script[data-olang]')) return;

  scriptEl = document.createElement('script');
  scriptEl.src = \`\${props.apiUrl}/embed.js\`;
  scriptEl.setAttribute('data-olang',    'true');
  scriptEl.setAttribute('data-api-url',  props.apiUrl ?? '');
  scriptEl.setAttribute('data-bot-id',   props.botId);
  scriptEl.setAttribute('data-theme',    props.theme ?? 'purple');
  scriptEl.setAttribute('data-welcome',  props.welcome ?? '');
  scriptEl.setAttribute('data-position', props.position ?? 'bottom-right');
  scriptEl.setAttribute('data-avatar',   props.avatar ?? '🤖');
  scriptEl.setAttribute('data-locale',   props.locale ?? 'en-US');
  scriptEl.async = true;
  document.body.appendChild(scriptEl);
});

onUnmounted(() => {
  scriptEl?.remove();
  document.getElementById('olang-chatbot-widget')?.remove();
});
</script>

<!-- Usage in App.vue or any parent component:
<OLangChat
  bot-id="${botId || 'your-bot-id'}"
  locale="${locale}"
  theme="${theme}"
/>
-->`,

    wordpress: `// Option 1: functions.php (Recommended for Developers)
// Add this to your active theme's functions.php
function add_olang_chatbot_widget() {
    echo '<script 
      src="${apiUrl}/embed.js"
      data-api-url="${apiUrl}"
      data-bot-id="${botId || 'your-bot-id'}"
      data-theme="${theme}"
      data-welcome="${welcome}"
      data-position="${position}"
      data-avatar="${avatar}"
      data-locale="${locale}"
    ></script>';
}
add_action('wp_footer', 'add_olang_chatbot_widget');

// Option 2: Plugin (Easiest for Non-Devs)
// 1. Install "WPCode" or "Insert Headers and Footers"
// 2. Add to Footer Scripts:
${embedCode}

// The widget will automatically load on all pages. No extra dependencies.`,

    html: `<!-- Paste before </body> in any HTML file -->
${embedCode}

<!-- 
  Optional: control the widget programmatically via JS

  // Open the chat window
  window.OlangEmbed?.open();

  // Close the chat window
  window.OlangEmbed?.close();

  // Pre-fill and send a message
  window.OlangEmbed?.send('What accounts do you offer?');

  // Get the current session ID
  const sessionId = window.OlangEmbed?.getSessionId();
-->`,
  };
}

function CodeSnippetsPanel({ embedCode, config }: {
  embedCode: string;
  config: { botId: string; theme: string; welcome: string; position: string; avatar: string; locale: string };
}) {
  const [activeTab, setActiveTab] = useState<Framework>('react');
  const [copied, setCopied] = useState(false);

  const snippets = getSnippets(
    embedCode, API_URL,
    config.botId, config.theme, config.welcome,
    config.position, config.avatar, config.locale
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-gray-900 font-sans">🧩 Framework Integration</h2>
        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
          copy-paste ready
        </span>
      </div>
      <p className="text-xs text-gray-400 mb-4 font-sans">
        Drop the widget into your existing project — no extra dependencies needed.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 mb-0 border-b border-gray-100 overflow-x-auto">
        {FRAMEWORK_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setCopied(false); }}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap font-sans border-b-2 ${
              activeTab === tab.id
                ? 'text-indigo-700 border-indigo-600 bg-indigo-50'
                : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span style={{ fontSize: 13 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="relative mt-0">
        <pre className="bg-gray-950 text-emerald-300 p-4 rounded-b-lg rounded-tr-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[420px] overflow-y-auto scrollbar-thin">
          {snippets[activeTab]}
        </pre>
        <button
          onClick={handleCopy}
          className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-sans ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>

      {/* Footer note per tab */}
      <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
        {activeTab === 'react' && (
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            <strong className="text-slate-700">React (CRA / Vite)</strong> — The component uses <code className="bg-slate-200 px-1 rounded">useEffect</code> to inject the script once and clean up on unmount. Import it in <code className="bg-slate-200 px-1 rounded">App.jsx</code> or any layout component.
          </p>
        )}
        {activeTab === 'nextjs' && (
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            <strong className="text-slate-700">Next.js 13+ App Router</strong> — Uses Next's built-in <code className="bg-slate-200 px-1 rounded">&lt;Script&gt;</code> with <code className="bg-slate-200 px-1 rounded">strategy="lazyOnload"</code> so it doesn't block page render. Add to <code className="bg-slate-200 px-1 rounded">app/layout.tsx</code> to appear on every page.
          </p>
        )}
        {activeTab === 'typescript' && (
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            <strong className="text-slate-700">TypeScript</strong> — Fully typed props with a <code className="bg-slate-200 px-1 rounded">Window</code> interface extension exposing the <code className="bg-slate-200 px-1 rounded">OlangEmbed</code> API for programmatic control (open, close, send, getSessionId).
          </p>
        )}
        {activeTab === 'vue' && (
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            <strong className="text-slate-700">Vue 3 (Composition API)</strong> — Uses <code className="bg-slate-200 px-1 rounded">onMounted</code> / <code className="bg-slate-200 px-1 rounded">onUnmounted</code> for clean lifecycle management. Compatible with Nuxt 3 — add to <code className="bg-slate-200 px-1 rounded">app.vue</code> or a layout component.
          </p>
        )}
        {activeTab === 'wordpress' && (
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            <strong className="text-slate-700">WordPress</strong> — Add the <code className="bg-slate-200 px-1 rounded">functions.php</code> snippet to your active theme, or use a free plugin like <strong>WPCode</strong> to paste the script tag in your Footer. Works with any theme or page builder (Elementor, Divi, Gutenberg).
          </p>
        )}
        {activeTab === 'html' && (
          <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
            <strong className="text-slate-700">Plain HTML</strong> — Paste the script tag before <code className="bg-slate-200 px-1 rounded">&lt;/body&gt;</code>. Works on any static site, Webflow, Shopify, or landing page. The optional JS block shows how to control the widget programmatically.
          </p>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function EmbedClient() {

  const [config, setConfig] = useState({
    botId: '',
    theme: 'purple',
    welcome: '👋 Hi! How can I help you today?',
    position: 'bottom-right',
    avatar: '🤖',
    locale: DEFAULT_LOCALE,
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [connectionStep, setConnectionStep] = useState<1 | 2 | 3>(1);

  const [generatedKey, setGeneratedKey] = useState('');
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyWarning, setKeyWarning] = useState('');
  const [clearBeforeUpload, setClearBeforeUpload] = useState(false);

  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ filename: string; size: number }>>([]);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [personalApiKey, setPersonalApiKey] = useState('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [registerStatus, setRegisterStatus] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [botRegistered, setBotRegistered] = useState(false);

  const [copied, setCopied] = useState(false);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; hash?: string; sources?: Array<{ filename: string; score: number }>; audit?: any }>>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (generatedKey) setPersonalApiKey(generatedKey);
  }, [generatedKey]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.avatar-picker-container')) setShowAvatarPicker(false);
    };
    if (showAvatarPicker) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAvatarPicker]);

  const embedCode = `<script 
  src="${API_URL}/embed.js"
  data-api-url="${API_URL}"
  data-bot-id="${config.botId}"
  data-theme="${config.theme}"
  data-welcome="${config.welcome}"
  data-position="${config.position}"
  data-avatar="${config.avatar}"
  data-locale="${config.locale}"
></script>`;

  const handleGenerateKey = async () => {
    setKeyLoading(true); setKeyError('');
    try {
      const res = await fetch(`${API_URL}/keys/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: `embed-${config.botId || 'bot'}-${Date.now().toString(36)}` })
      });
      const data = await res.json();
      if (data.ok) { setGeneratedKey(data.key); setKeyWarning(data.warning || ''); }
      else setKeyError(data.error || 'Failed to generate key');
    } catch (err: unknown) {
      setKeyError(err instanceof Error ? err.message : 'Server unreachable');
    } finally { setKeyLoading(false); }
  };

  const copyKey = async () => {
    await navigator.clipboard.writeText(generatedKey);
    setKeyCopied(true); setTimeout(() => setKeyCopied(false), 2000);
  };

  const handleUpload = async () => {
    if (!uploadFiles.length || !config.botId || !personalApiKey) return;
    setUploadLoading(true); setUploadStatus('Uploading & indexing...');
    const formData = new FormData();
    formData.append('bot_id', config.botId);
    formData.append('clear_first', clearBeforeUpload.toString());
    uploadFiles.forEach(f => formData.append('files', f));
    try {
      const res = await fetch(`${API_URL}/upload/bot`, {
        method: 'POST', headers: { 'x-api-key': personalApiKey }, body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus(`✅ ${data.uploaded.length} file(s) uploaded, ${data.inserted} chunks indexed`);
        setUploadedDocs(prev => [...prev, ...data.uploaded]);
        setUploadFiles([]);
      } else setUploadStatus(`❌ ${data.error}`);
    } catch (err: unknown) {
      setUploadStatus(`❌ ${err instanceof Error ? err.message : 'Upload failed'}`);
    } finally { setUploadLoading(false); }
  };

  const handleRegisterBot = async () => {
    if (!config.botId || !personalApiKey) { setRegisterStatus('❌ Bot ID and API key required'); return; }
    setIsRegistering(true); setRegisterStatus('Registering...');
    try {
      const res = await fetch(`${API_URL}/admin/bots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': personalApiKey },
        body: JSON.stringify({ bot_id: config.botId, doc_root: `./docs/${config.botId}`, welcome: config.welcome })
      });
      const data = await res.json();
      if (data.ok) { setRegisterStatus(`✅ Bot "${config.botId}" registered — copy your embed tag`); setBotRegistered(true); }
      else setRegisterStatus(`❌ ${data.error}`);
    } catch (err: unknown) {
      setRegisterStatus(`❌ ${err instanceof Error ? err.message : 'Failed'}`);
    } finally { setIsRegistering(false); }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput(''); setIsTyping(true);
    
    setTimeout(() => {
      const responseText = getMockResponse(userMsg, config.welcome, config.avatar);
      const hash = mockHash(userMsg + responseText + Date.now().toString());
      
      // Simulate grounding sources (50% chance for demo)
      const hasSources = Math.random() > 0.5;
      const sources = hasSources ? [
        { filename: 'Document.txt', score: parseFloat((Math.random() * 40 + 20).toFixed(1)) }
      ] : [];
      
      // Simulate audit object
      const audit = {
        execution_hash: hash,
        merkle_root: '0x' + hash.slice(2, 18) + 'merkle',
        governance_profile_hash: '0x' + hash.slice(2, 18) + 'policy',
        integrity: { valid: true }
      };
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: responseText, 
        hash,
        sources,
        audit
      }]);
      setIsTyping(false);
    }, 800 + Math.random() * 700);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  const closePreview = () => { setPreviewOpen(false); setTimeout(() => setMessages([]), 200); };

  const GRAD =
    config.theme === 'cyan'  ? 'linear-gradient(135deg,#0891b2,#0e7490)' :
    config.theme === 'green' ? 'linear-gradient(135deg,#059669,#047857)' :
                               'linear-gradient(135deg,#6d28d9,#4f46e5)';

  const stepLabel = (s: number, label: string) => (
    <div className="flex items-center gap-2 mb-1">
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
        connectionStep > s ? 'bg-emerald-500 text-white' :
        connectionStep === s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
      }`}>
        {connectionStep > s ? '✓' : s}
      </span>
      <span className={`text-sm font-semibold ${connectionStep === s ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
    </div>
  );

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white py-12 px-4 font-sans">
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-5xl mx-auto mt-16">

        {/* ── HEADER ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-medium mb-4 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
            GOVERNED AI · OLANG KERNEL
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 font-sans tracking-tight">
            Embed O-Lang Chatbot
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-sans">
            Add a governed AI assistant to any website in 60 seconds. No framework required — just paste one script tag.
          </p>
        </div>

        {/* ── GOVERNANCE STRIP ── */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: '⬡', label: 'AUDITABLE', title: 'Every response hashed', desc: 'The O-Lang kernel generates a cryptographic execution hash for every single response — stored in an immutable audit log.', bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', labelColor: 'text-blue-500', titleColor: 'text-blue-900' },
            { icon: '↺', label: 'REPLAYABLE', title: 'Full workflow trace', desc: 'Every step of the AI workflow — resolver chain, vector search, LLM call — is recorded and can be replayed exactly as it ran.', bg: 'bg-violet-50', border: 'border-violet-100', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', labelColor: 'text-violet-500', titleColor: 'text-violet-900' },
            { icon: '✓', label: 'VERIFIABLE', title: 'Merkle + RSA signed', desc: 'Any response can be independently verified using its hash. Merkle root integrity + RSA-SHA256 kernel signature — no trust required.', bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', labelColor: 'text-emerald-500', titleColor: 'text-emerald-900' },
          ].map(({ icon, label, title, desc, bg, border, iconBg, iconColor, labelColor, titleColor }) => (
            <div key={label} className={`${bg} ${border} border rounded-xl p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`${iconBg} ${iconColor} w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold font-mono`}>{icon}</div>
                <span className={`text-xs font-semibold tracking-widest ${labelColor} font-mono`}>{label}</span>
              </div>
              <p className={`text-sm font-semibold ${titleColor} mb-1 font-sans`}>{title}</p>
              <p className="text-xs text-gray-500 leading-relaxed font-sans">{desc}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── LEFT ── */}
          <div className="space-y-6">

            {/* Appearance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold mb-4 text-gray-900 font-sans">🎨 Customize Appearance</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide font-sans">Color Theme</label>
                  <div className="flex gap-3">
                    {['purple', 'cyan', 'green'].map(theme => (
                      <button key={theme} onClick={() => setConfig({ ...config, theme })}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${config.theme === theme ? 'border-gray-900 scale-110 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}
                        style={{ background: theme === 'purple' ? 'linear-gradient(135deg,#6d28d9,#4f46e5)' : theme === 'cyan' ? 'linear-gradient(135deg,#0891b2,#0e7490)' : 'linear-gradient(135deg,#059669,#047857)' }}
                        aria-label={`${theme} theme`} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide font-sans">Widget Position</label>
                  <select value={config.position} onChange={e => setConfig({ ...config, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white font-sans">
                    <option value="bottom-right">Bottom Right ↘️</option>
                    <option value="bottom-left">Bottom Left ↙️</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide font-sans">Assistant Avatar</label>
                  <div className="avatar-picker-container relative">
                    <div className="flex gap-3 items-center">
                      <button onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm border-2 border-gray-200 hover:border-indigo-400 transition-colors bg-white">
                        {config.avatar}
                      </button>
                      <input type="text" value={config.avatar} onChange={e => setConfig({ ...config, avatar: e.target.value.slice(0, 4) })}
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center text-xl font-sans" placeholder="🤖" maxLength={4} />
                    </div>
                    {showAvatarPicker && (
                      <div className="absolute top-full left-0 mt-2 p-3 bg-white rounded-xl shadow-xl border border-gray-200 z-10 w-64">
                        <p className="text-xs text-gray-400 mb-2 font-sans">Click to select:</p>
                        <div className="grid grid-cols-8 gap-1.5">
                          {AVATAR_OPTIONS.map(emoji => (
                            <button key={emoji} onClick={() => { setConfig({ ...config, avatar: emoji }); setShowAvatarPicker(false); }}
                              className={`w-7 h-7 flex items-center justify-center text-lg rounded-lg transition-all hover:scale-110 ${config.avatar === emoji ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'hover:bg-gray-100'}`}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide font-sans">Welcome Message</label>
                  <input type="text" value={config.welcome} onChange={e => setConfig({ ...config, welcome: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-sans" placeholder="👋 Hi! How can I help?" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide font-sans">User Locale</label>
                  <select value={config.locale} onChange={e => setConfig({ ...config, locale: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white font-sans">
                    <option value="en-US">🇺🇸 English (US) — $</option>
                    <option value="en-GB">🇬🇧 English (UK) — £</option>
                    <option value="fr-FR">🇫🇷 Français — €</option>
                    <optgroup label="🌍 Africa — English">
                      <option value="en-NG">🇳🇬 Nigeria — ₦ (Naira)</option>
                      <option value="en-KE">🇰🇪 Kenya — KSh (Shilling)</option>
                      <option value="en-ZA">🇿🇦 South Africa — R (Rand)</option>
                      <option value="en-GH">🇬🇭 Ghana — ₵ (Cedi)</option>
                      <option value="en-UG">🇺🇬 Uganda — USh (Shilling)</option>
                      <option value="en-TZ">🇹🇿 Tanzania — TSh (Shilling)</option>
                      <option value="en-ZW">🇿🇼 Zimbabwe — $ (USD/ZWL)</option>
                      <option value="en-BW">🇧🇼 Botswana — P (Pula)</option>
                      <option value="en-MU">🇲🇺 Mauritius — ₨ (Rupee)</option>
                      <option value="en-RW">🇷🇼 Rwanda — FRw (Franc)</option>
                      <option value="en-SS">🇸🇸 South Sudan — £ (Pound)</option>
                    </optgroup>
                    <optgroup label="🌍 Africa — Français">
                      <option value="fr-SN">🇸🇳 Senegal — CFA (XOF)</option>
                      <option value="fr-CI">🇨🇮 Côte d'Ivoire — CFA (XOF)</option>
                      <option value="fr-CM">🇨🇲 Cameroon — CFA (XAF)</option>
                      <option value="fr-DZ">🇩🇿 Algeria — DA (Dinar)</option>
                      <option value="fr-MA">🇲🇦 Morocco — DH (Dirham)</option>
                      <option value="fr-TN">🇹🇳 Tunisia — DT (Dinar)</option>
                      <option value="fr-BF">🇧🇫 Burkina Faso — CFA (XOF)</option>
                      <option value="fr-ML">🇲🇱 Mali — CFA (XOF)</option>
                      <option value="fr-NE">🇳🇪 Niger — CFA (XOF)</option>
                      <option value="fr-TG">🇹🇬 Togo — CFA (XOF)</option>
                      <option value="fr-BJ">🇧🇯 Benin — CFA (XOF)</option>
                      <option value="fr-GA">🇬🇦 Gabon — CFA (XAF)</option>
                      <option value="fr-CG">🇨🇬 Congo — CFA (XAF)</option>
                      <option value="fr-CD">🇨🇩 DR Congo — FC (Franc)</option>
                    </optgroup>
                    <optgroup label="🌍 Africa — العربية">
                      <option value="ar-EG">🇪🇬 Egypt — ج.م (Pound)</option>
                      <option value="ar-MA">🇲🇦 Morocco — د.م. (Dirham)</option>
                      <option value="ar-DZ">🇩🇿 Algeria — د.ج (Dinar)</option>
                      <option value="ar-TN">🇹🇳 Tunisia — د.ت (Dinar)</option>
                      <option value="ar-LY">🇱🇾 Libya — ل.د (Dinar)</option>
                      <option value="ar-SD">🇸🇩 Sudan — ج.س. (Pound)</option>
                    </optgroup>
                    <optgroup label="🌍 Africa — Português">
                      <option value="pt-AO">🇦🇴 Angola — Kz (Kwanza)</option>
                      <option value="pt-MZ">🇲🇿 Mozambique — MT (Metical)</option>
                      <option value="pt-CV">🇨🇻 Cape Verde — $ (Escudo)</option>
                      <option value="pt-GW">🇬🇼 Guinea-Bissau — CFA (XOF)</option>
                      <option value="pt-ST">🇸🇹 São Tomé — Db (Dobra)</option>
                    </optgroup>
                    <optgroup label="🌍 Africa — Kiswahili">
                      <option value="sw-KE">🇰🇪 Kenya (Swahili) — KSh</option>
                      <option value="sw-TZ">🇹🇿 Tanzania (Swahili) — TSh</option>
                      <option value="sw-UG">🇺🇬 Uganda (Swahili) — USh</option>
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1 font-sans">Determines currency symbols and number formatting in chat responses.</p>
                </div>
              </div>
            </div>

            {/* Connection Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold mb-1 text-gray-900 font-sans">🔌 Connection Settings</h2>
              <p className="text-xs text-gray-400 mb-5 font-sans">Complete these 3 steps once — then copy your embed tag.</p>

              <div className="flex items-center gap-1 mb-6">
                {[1, 2, 3].map((s, i) => (
                  <div key={s} className="flex items-center flex-1">
                    <div className={`h-1.5 flex-1 rounded-full transition-all ${connectionStep > s ? 'bg-emerald-400' : connectionStep === s ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                    {i < 2 && <div className="w-1" />}
                  </div>
                ))}
              </div>

              {/* Step 1 */}
              <div className={connectionStep !== 1 ? 'opacity-40 pointer-events-none' : ''}>
                {stepLabel(1, 'Generate Your API Key')}
                {connectionStep === 1 && (
                  <div className="pl-8 mt-2 space-y-3">
                    <p className="text-xs text-gray-500 font-sans">Cryptographically secure key — shown <strong>once</strong>.</p>
                    {!generatedKey && (
                      <button onClick={handleGenerateKey} disabled={keyLoading}
                        className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${keyLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'} font-sans`}>
                        {keyLoading ? '⏳ Generating...' : '🔑 Generate Secure Key'}
                      </button>
                    )}
                    {keyError && <p className="text-xs text-red-500 font-sans">{keyError}</p>}
                    {generatedKey && (
                      <>
                        <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
                          <div className="px-3 py-3">
                            <p className="text-[10px] text-amber-400 mb-2 font-medium font-mono">⚠️ SECURITY NOTICE</p>
                            <p className="text-xs text-gray-300 mb-3 font-sans">{keyWarning || 'Store this key securely. It will never be shown again.'}</p>
                            <div className="flex items-start gap-2">
                              <code className="flex-1 text-emerald-400 text-xs font-mono break-all leading-relaxed bg-black/30 p-2 rounded">{generatedKey}</code>
                              <button onClick={copyKey} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${keyCopied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'} font-sans`}>
                                {keyCopied ? '✓ Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                          <div className="bg-amber-900/30 border-t border-amber-700 px-3 py-2">
                            <p className="text-[10px] text-amber-200 font-mono">🔐 Use in <code className="bg-amber-800 px-1 rounded">x-api-key</code> header for Step 3.</p>
                          </div>
                        </div>
                        <button onClick={() => setConnectionStep(2)} className="w-full py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-sans">
                          ✅ I've saved my key — Continue
                        </button>
                      </>
                    )}
                  </div>
                )}
                {connectionStep > 1 && (
                  <div className="pl-8 mt-1 flex items-center gap-2">
                    <p className="text-xs text-emerald-600 font-sans">✓ Key generated</p>
                    <button onClick={() => setConnectionStep(1)} className="text-[10px] text-gray-400 hover:text-gray-600 underline font-sans">regenerate</button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 my-5" />

              {/* Step 2 */}
              <div className={connectionStep !== 2 ? 'opacity-40 pointer-events-none' : ''}>
                {stepLabel(2, 'Upload Your Docs')}
                {connectionStep === 2 && (
                  <div className="pl-8 mt-2 space-y-3">
                    <p className="text-xs text-gray-500 font-sans">Upload files that ground your AI. Each bot gets its own isolated knowledge base.</p>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1 font-sans">Bot ID <span className="ml-1 text-[10px] font-normal text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full font-sans">goes in embed tag</span></label>
                      <input type="text" value={config.botId} onChange={e => setConfig({ ...config, botId: e.target.value.trim().replace(/\s+/g, '-').toLowerCase() })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 font-sans" placeholder="my-support-bot" />
                    </div>
                    <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                      onDrop={e => { e.preventDefault(); setDragging(false); setUploadFiles(Array.from(e.dataTransfer.files)); }}
                      onClick={() => document.getElementById('file-input')?.click()}
                      className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 bg-gray-50'} font-sans`}>
                      <div className="text-2xl mb-1">📄</div>
                      <p className="text-xs text-gray-600 font-medium font-sans">{uploadFiles.length ? `${uploadFiles.length} file(s) ready` : 'Drag & drop or click to browse'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-sans">PDF, TXT, MD, DOCX — max 10MB</p>
                      <input id="file-input" type="file" multiple accept=".pdf,.txt,.md,.docx" className="hidden" onChange={e => setUploadFiles(Array.from(e.target.files || []))} />
                    </div>
                    {uploadFiles.length > 0 && (
                      <ul className="space-y-1">{uploadFiles.map((f, i) => (
                        <li key={i} className="flex justify-between text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded font-sans">
                          <span>📎 {f.name}</span><span className="text-gray-400">{(f.size / 1024).toFixed(1)} KB</span>
                        </li>
                      ))}</ul>
                    )}
                    <button onClick={handleUpload} disabled={uploadLoading || !uploadFiles.length || !config.botId}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${!uploadLoading && uploadFiles.length && config.botId ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} font-sans`}>
                      {uploadLoading ? '⏳ Uploading & Indexing...' : '⬆️ Upload & Index Docs'}
                    </button>
                    {uploadStatus && <p className={`text-xs ${uploadStatus.startsWith('✅') ? 'text-emerald-600' : 'text-red-500'} font-sans`}>{uploadStatus}</p>}
                    {uploadedDocs.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-emerald-800 mb-1.5 font-sans">📂 {uploadedDocs.length} doc(s) indexed</p>
                        {uploadedDocs.map(d => (
                          <div key={d.filename} className="flex justify-between text-[10px] text-emerald-700 font-sans">
                            <span>✓ {d.filename}</span><span>{(d.size / 1024).toFixed(1)} KB</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setConnectionStep(3)} disabled={uploadedDocs.length === 0}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${uploadedDocs.length > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} font-sans`}>
                      Docs uploaded → Register Bot
                    </button>
                  </div>
                )}
                {connectionStep > 2 && (
                  <div className="pl-8 mt-1 flex items-center gap-2">
                    <p className="text-xs text-emerald-600 font-sans">✓ {uploadedDocs.length} doc(s) indexed for <strong>{config.botId}</strong></p>
                    <button onClick={() => setConnectionStep(2)} className="text-[10px] text-gray-400 hover:text-gray-600 underline font-sans">add more</button>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 my-5" />

              {/* Step 3 */}
              <div className={connectionStep !== 3 ? 'opacity-40 pointer-events-none' : ''}>
                {stepLabel(3, 'Register Bot')}
                {connectionStep === 3 && (
                  <div className="pl-8 mt-2 space-y-3">
                    <p className="text-xs text-gray-500 font-sans">Paste your API key to link <strong className="text-gray-800">{config.botId || 'your bot'}</strong> to its docs.</p>
                    <div className="relative">
                      <input type={keyVisible ? 'text' : 'password'} value={personalApiKey} onChange={e => setPersonalApiKey(e.target.value)}
                        className="w-full px-3 py-2 pr-16 border border-gray-200 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500" placeholder="olg_••••••••••••••••" />
                      <button type="button" onClick={() => setKeyVisible(!keyVisible)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 font-sans">
                        {keyVisible ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <button onClick={handleRegisterBot} disabled={isRegistering || !config.botId || !personalApiKey}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${!isRegistering && config.botId && personalApiKey ? 'bg-gray-900 text-white hover:bg-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'} font-sans`}>
                      {isRegistering ? '⏳ Registering...' : '🔗 Register Bot'}
                    </button>
                    {registerStatus && <p className={`text-xs ${registerStatus.startsWith('✅') ? 'text-emerald-600' : 'text-red-500'} font-sans`}>{registerStatus}</p>}
                    {botRegistered && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 font-sans">🎉 All done! Copy your embed tag from the panel on the right.</div>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="space-y-6">

            {/* Live Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-gray-900 font-sans">👁️ Live Preview</h2>
                <span className="text-[10px] font-mono text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">governance badges active</span>
              </div>
              <div className="mb-3 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 flex items-start gap-2">
                <span className="text-emerald-400 text-xs mt-0.5">⬡</span>
                <p className="text-[10px] text-slate-400 leading-relaxed font-mono">
                  Preview uses simulated responses. In production, each response carries a real kernel execution hash, Merkle-signed audit entry, and live verification endpoint.
                </p>
              </div>
              <div className="relative h-[26rem] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                <div className="absolute inset-0 p-4">
                  <div className="h-8 bg-gray-200 rounded mb-4 w-3/4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-4/6" />
                  </div>
                </div>
                <div className={`absolute ${config.position === 'bottom-left' ? 'left-4' : 'right-4'} bottom-4`} style={{ width: 60, height: 60 }}>
                  <button
                    onClick={() => {
                      setPreviewOpen(!previewOpen);
                      if (!previewOpen && messages.length === 0)
                        setTimeout(() => {
                          const welcome = `${config.avatar} ${config.welcome}`;
                          setMessages([{ role: 'assistant', text: welcome, hash: mockHash(welcome) }]);
                        }, 300);
                    }}
                    className="w-full h-full rounded-2xl flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform"
                    style={{ background: GRAD, color: 'white', border: 'none' }}
                    aria-label="Toggle chat preview"
                  >
                    {config.avatar}
                  </button>
                  {previewOpen && (
                    <div className="absolute bottom-16 right-0 w-80 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col" style={{ maxHeight: '26rem', background: '#ffffff' }}>
                      <div className="p-3 flex justify-between items-center shrink-0 border-b border-gray-200" style={{ background: '#f9fafb' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: GRAD }}>{config.avatar}</div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900 font-sans">AI Assistant</p>
                            <p className="text-[9px] text-emerald-600 font-mono">governed · o-lang kernel</p>
                          </div>
                        </div>
                        <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1">×</button>
                      </div>
                      {/* <div className="flex gap-1.5 px-3 py-2 border-b border-gray-100" style={{ background: 'rgba(0,0,0,0.03)' }}>
                        {[
                          { label: 'AUDITABLE', color: 'text-blue-700 border-blue-200 bg-blue-50' },
                          { label: 'REPLAYABLE', color: 'text-violet-700 border-violet-200 bg-violet-50' },
                          { label: 'VERIFIABLE', color: 'text-emerald-700 border-emerald-200 bg-emerald-50' },
                        ].map(({ label, color }) => (
                          <span key={label} className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${color}`}>{label}</span>
                        ))}
                      </div> */}
                      <div ref={messagesContainerRef} className="flex-1 p-3 overflow-y-auto min-h-[10rem]" style={{ background: '#ffffff' }}>
                        {messages.length === 0 && !isTyping && (
                          <p className="text-xs text-gray-400 text-center py-4 font-mono">Start a conversation…</p>
                        )}
                        {messages.map((msg, idx) => (
                          <div key={idx} className={`mb-3 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-3 py-2 rounded-xl max-w-[85%] text-xs leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'text-white rounded-br-sm' : 'text-gray-800 border border-gray-200 rounded-bl-sm'}`}
                              style={{ background: msg.role === 'user' ? GRAD : '#f3f4f6' }}>
                              {msg.text}
                            </div>
                            {msg.role === 'assistant' && msg.hash && <GovernanceBadges hash={msg.hash} sources={msg.sources} audit={msg.audit} index={idx} />}
                          </div>
                        ))}
                        {isTyping && (
                          <div className="flex justify-start mb-2">
                            <div className="px-3 py-2 rounded-xl rounded-bl-sm border border-gray-200 flex gap-1" style={{ background: '#f3f4f6' }}>
                              {[0, 150, 300].map(d => (
                                <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce inline-block" style={{ animationDelay: `${d}ms` }} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5 border-t border-gray-200 flex gap-2" style={{ background: '#ffffff' }}>
                        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                          placeholder="Ask a question…"
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs outline-none border border-gray-300 text-gray-800 placeholder-gray-400 font-sans"
                          style={{ background: '#ffffff' }} disabled={isTyping} />
                        <button onClick={() => handleSendMessage()} disabled={!input.trim() || isTyping}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity disabled:opacity-40 font-sans"
                          style={{ background: GRAD }}>Send</button>
                      </div>
                      <p className="text-[9px] text-gray-400 text-center py-1.5 border-t border-gray-100 font-mono">preview mode · responses simulated</p>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center font-sans">💡 Click {config.avatar} to chat · governance badges shown on every response</p>
            </div>

            {/* Embed Code */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold mb-4 text-gray-900 font-sans">📋 Your Embed Code</h2>
              {!botRegistered && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-sans">
                  ⚠️ Complete the 3 steps on the left before copying this tag.
                </div>
              )}
              <div className="relative">
                <pre className={`bg-gray-900 text-emerald-400 p-4 rounded-lg overflow-x-auto text-xs font-mono transition-opacity ${!botRegistered ? 'opacity-25 select-none' : ''}`}>
                  {embedCode}
                </pre>
                <button onClick={copyToClipboard} disabled={!botRegistered}
                  className={`absolute top-2 right-2 px-3 py-1.5 rounded text-xs font-medium transition-all ${copied ? 'bg-emerald-500 text-white' : botRegistered ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-600 text-gray-500 cursor-not-allowed'} font-sans`}>
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              {botRegistered && (
                <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <h3 className="font-medium text-indigo-900 mb-2 text-sm font-sans">📌 Where to paste this:</h3>
                  <ol className="text-xs text-indigo-700 space-y-1 list-decimal list-inside font-sans">
                    <li>Open your website's HTML file</li>
                    <li>Find the <code className="bg-indigo-100 px-1 rounded">&lt;/body&gt;</code> tag</li>
                    <li>Paste just before <code className="bg-indigo-100 px-1 rounded">&lt;/body&gt;</code></li>
                    <li>Save and refresh</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── FRAMEWORK SNIPPETS — now full-width ── */}
        <div className="max-w-5xl mx-auto mt-8">
          <CodeSnippetsPanel embedCode={embedCode} config={config} />
        </div>

      </div>
    </div>
  );
}