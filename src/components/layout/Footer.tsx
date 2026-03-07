import Link from "next/link";

const FOOTER_LINKS = {
  Product: [
    { label: "Playground", href: "/playground" },
    { label: "Resolver Registry", href: "/registry" },
    { label: "O-Lang Cloud", href: "/cloud" },
    { label: "Changelog", href: "/changelog" },
  ],
  Developers: [
    { label: "Documentation", href: "/docs" },
    { label: "Quickstart", href: "/docs/quickstart" },
    { label: "API Reference", href: "/docs/reference" },
    { label: "GitHub", href: "https://github.com/o-lang" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Research", href: "/research" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "mailto:hello@o-lang.dev" },
  ],
};

export function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #080e1a 0%, #060b16 100%)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
      className="pt-16 pb-8 px-[5%]"
    >
      <div className="max-w-[1160px] mx-auto">

        {/* Grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.09)" }}
        >
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-[30px] h-[30px] rounded-[8px] bg-grad-blue flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" className="w-4 h-4">
                  <rect x="3" y="3" width="8" height="8" rx="2" />
                  <rect x="13" y="3" width="8" height="8" rx="2" opacity=".7" />
                  <rect x="3" y="13" width="8" height="8" rx="2" opacity=".7" />
                  <rect x="13" y="13" width="8" height="8" rx="2" opacity=".35" />
                </svg>
              </div>
              <span className="font-syne text-[18px] font-extrabold text-white">
                O<span className="text-blue-muted">-Lang</span>
              </span>
            </div>

            <p className="text-sm leading-relaxed max-w-[270px]"
               style={{ color: "rgba(255,255,255,0.62)" }}>
              The open protocol for governed AI orchestration. Deterministic,
              auditable, and built for global AI systems.
            </p>

            <div className="flex flex-wrap gap-2 mt-5">
              {["MIT License", "v1.1.0", "Founded in Africa"].map((b) => (
                <span
                  key={b}
                  className="font-mono text-[10px] px-2.5 py-1 rounded"
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <p
                className="font-syne text-[11px] font-bold tracking-[1.5px] uppercase mb-4"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {title}
              </p>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-150 footer-link"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-7">
          <span className="text-[13px]" style={{ color: "rgba(255,255,255,0.48)" }}>
            © 2026 O-Lang. Open source under MIT License. Founded by Olalekan Ogundipe.
          </span>

          <div className="flex gap-2">
            {["sha3-256 audit", "ed25519 signed", "kernel v1.1.0"].map((b) => (
              <span
                key={b}
                className="font-mono text-[10px] px-2.5 py-1 rounded"
                style={{
                  color: "rgba(255,255,255,0.50)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.11)",
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Scoped hover styles — no JS needed */}
      <style>{`
        .footer-link {
          color: rgba(255, 255, 255, 0.68);
        }
        .footer-link:hover {
          color: rgba(255, 255, 255, 0.95);
        }
      `}</style>
    </footer>
  );
}