"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Platform",
    items: [
      { label: "O-Lang Kernel", href: "/kernel", desc: "Deterministic execution engine" },
      { label: "GRaaS Economy", href: "/graas", desc: "Decentralized agent registry & escrow" },
      { label: "Resolver Hub", href: "/registry", desc: "Pre-built governed tools" },
    ]
  },
  {
    label: "Integrations",
    items: [
      { label: "LangChain Wrapper", href: "/docs/integrations/langchain", desc: "Govern existing pipelines" },
      { label: "CrewAI Middleware", href: "/docs/integrations/crewai", desc: "Add audit trails to swarms" },
      { label: "Python & JS SDKs", href: "/docs/sdks", desc: "Native protocol bindings" },
    ]
  },
  {
    label: "Solutions",
    items: [
      { label: "Financial Services", href: "/solutions/finance", desc: "Multilingual banking assistants" },
      { label: "Healthcare & ICU", href: "/solutions/healthcare", desc: "Audit-ready patient workflows" },
      { label: "Government & IoT", href: "/solutions/government", desc: "Tamper-evident citizen services" },
    ]
  },
  { label: "Docs", href: "/docs" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeDropdown]);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-[5%]",
        "border-b transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md border-gray-200 shadow-sm"
          : "bg-white border-gray-200"
      )}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setActiveDropdown(null)}>
        <div className="w-[34px] h-[34px] rounded-[9px] overflow-hidden shadow-sm flex-shrink-0 bg-[#FFD21E] flex items-center justify-center">
          <Image
            src="/olang-logo.png"
            alt="O-Lang"
            width={34}
            height={34}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <span className="font-syne text-[19px] font-extrabold tracking-[-0.4px] text-gray-900">
          O<span className="text-[#E6B800]">-Lang</span>
        </span>
        <span className="font-mono text-[10px] text-gray-600 bg-gray-100 border border-gray-200 px-[7px] py-[2px] rounded">
          v1.5.0
        </span>
      </Link>

      {/* Links */}
      <div className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map((item) => {
          if ("items" in item) {
            const isOpen = activeDropdown === item.label;
            return (
              <div key={item.label} className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveDropdown(isOpen ? null : item.label);
                  }}
                  className={cn(
                    "px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5",
                    isOpen ? "text-gray-900 bg-gray-100" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {item.label}
                  <svg className={cn("w-3 h-3 transition-transform duration-200", isOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 space-y-1">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={subItem.href}
                          className="block px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group/item"
                          onClick={() => setActiveDropdown(null)}
                        >
                          <div className="text-sm font-semibold text-gray-900 group-hover/item:text-[#E6B800] transition-colors">
                            {subItem.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {subItem.desc}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className="px-3.5 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:text-gray-900 hover:bg-gray-50 transition-all duration-150"
              onClick={() => setActiveDropdown(null)}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-2.5">
        <Link
          href="https://github.com/O-Lang-Central"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-all"
          onClick={() => setActiveDropdown(null)}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px]">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </Link>
        <Link
          href="/graas"
          className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-gray-900 bg-[#FFD21E] rounded-lg shadow-sm hover:bg-[#E6B800] hover:-translate-y-px transition-all"
          onClick={() => setActiveDropdown(null)}
        >
          Explore the Economy
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}


// "use client";

// import Link from "next/link";
// import Image from "next/image";
// import { useEffect, useState } from "react";
// import { cn } from "@/lib/utils";

// const NAV_LINKS = [
//   { label: "How it works", href: "/#how" },
//   { label: "Playground",   href: "/playground" },
//   { label: "Syntax",        href: "/syntax" },
//   { label: "Lab",           href: "/lab" },
//   { label: "Tool Registry", href: "/registry" },
//   { label: "Docs",         href: "/docs" },
// ];

// export function Navbar() {
//   const [scrolled, setScrolled] = useState(false);

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 40);
//     window.addEventListener("scroll", onScroll, { passive: true });
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   return (
//     <nav
//       className={cn(
//         "fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-[5%]",
//         "border-b border-white/[0.07] transition-all duration-300",
//         scrolled
//           ? "bg-hero/[0.97] backdrop-blur-xl"
//           : "bg-hero/[0.92] backdrop-blur-md"
//       )}
//     >
//       {/* Logo */}
//       <Link href="/" className="flex items-center gap-2.5">
//         <div className="w-[34px] h-[34px] rounded-[9px] overflow-hidden shadow-[0_0_16px_rgba(26,86,219,0.4)] flex-shrink-0">
//           <Image
//             src="/olang-logo.png"
//             alt="O-Lang"
//             width={34}
//             height={34}
//             className="w-full h-full object-cover"
//             priority
//           />
//         </div>
//         <span className="font-syne text-[19px] font-extrabold tracking-[-0.4px] text-white">
//           O<span className="text-blue-muted">-Lang</span>
//         </span>
//         <span className="font-mono text-[10px] text-blue-muted bg-blue-muted/10 border border-blue-muted/20 px-[7px] py-[2px] rounded">
//           v1.3.0
//         </span>
//       </Link>

//       {/* Links */}
//       <div className="hidden md:flex items-center gap-0.5">
//         {NAV_LINKS.map((link) => (
//           <Link
//             key={link.href}
//             href={link.href}
//             className="px-3.5 py-1.5 text-sm font-medium text-white/70 rounded-lg hover:text-white hover:bg-white/[0.08] transition-all duration-150"
//           >
//             {link.label}
//           </Link>
//         ))}
//       </div>

//       {/* CTAs */}
//       <div className="flex items-center gap-2.5">
//         <Link
//           href="https://github.com/o-lang"
//           target="_blank"
//           rel="noreferrer"
//           className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold text-white/80 border border-white/15 rounded-lg hover:text-white hover:border-white/30 hover:bg-white/[0.06] transition-all"
//         >
//           <svg viewBox="0 0 24 24" fill="currentColor" className="w-[14px] h-[14px]">
//             <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
//           </svg>
//           GitHub
//         </Link>
//         <Link
//           href="/playground"
//           className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-white bg-grad-blue rounded-lg shadow-blue hover:shadow-[0_4px_14px_rgba(26,86,219,0.45)] hover:-translate-y-px transition-all"
//         >
//           Try Playground →
//         </Link>
//       </div>
//     </nav>
//   );
// }