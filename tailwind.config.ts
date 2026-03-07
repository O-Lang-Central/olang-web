import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne:  ["var(--font-syne)", "sans-serif"],
        sans:  ["var(--font-dm-sans)", "sans-serif"],
        mono:  ["var(--font-dm-mono)", "monospace"],
      },
      colors: {
        ink: {
          DEFAULT: "#0c1220",
          2: "#1f2937",
          3: "#374151",
          4: "#6b7280",
          5: "#9ca3af",
        },
        surface: {
          DEFAULT: "#ffffff",
          2: "#f8f9fb",
          3: "#f0f2f5",
          4: "#e4e7ed",
        },
        border: {
          DEFAULT: "#e4e7ed",
          2: "#c9cdd8",
        },
        blue: {
          DEFAULT: "#1a56db",
          dark:    "#1245b8",
          light:   "#e8effe",
          muted:   "#93c5fd",
        },
        green: {
          DEFAULT: "#059669",
          dark:    "#047857",
          light:   "#ecfdf5",
          muted:   "#6ee7b7",
        },
        purple: {
          DEFAULT: "#7c3aed",
          dark:    "#6d28d9",
          light:   "#f5f3ff",
          muted:   "#c4b5fd",
        },
        amber: {
          DEFAULT: "#d97706",
          light:   "#fffbeb",
        },
        danger: {
          DEFAULT: "#dc2626",
          light:   "#fef2f2",
        },
        // Dark hero background
        hero: {
          DEFAULT: "#0c1220",
          2:       "#1a2540",
        },
      },
      backgroundImage: {
        "grad-hero":   "linear-gradient(135deg, #0c1220 0%, #1a2540 50%, #0c1220 100%)",
        "grad-blue":   "linear-gradient(135deg, #1245b8, #1a56db)",
        "grad-green":  "linear-gradient(135deg, #047857, #059669)",
        "grad-purple": "linear-gradient(135deg, #6d28d9, #7c3aed)",
        "grad-amber":  "linear-gradient(135deg, #b45309, #d97706)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "28px",
      },
      boxShadow: {
        sm:   "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        md:   "0 4px 16px rgba(0,0,0,0.09)",
        lg:   "0 12px 40px rgba(0,0,0,0.13)",
        blue: "0 4px 20px rgba(26,86,219,0.35)",
        glow: "0 0 30px rgba(26,86,219,0.25)",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulse: {
          "0%, 100%": { boxShadow: "0 0 0 3px rgba(96,165,250,0.25)" },
          "50%":       { boxShadow: "0 0 0 6px rgba(96,165,250,0.1)" },
        },
        statusGlow: {
          "0%, 100%": { boxShadow: "0 0 0 3px rgba(5,150,105,0.2)" },
          "50%":       { boxShadow: "0 0 0 5px rgba(5,150,105,0.1)" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up":    "fadeUp 0.6s ease both",
        "pulse-ring": "pulse 2s ease-in-out infinite",
        "status-glow":"statusGlow 2.2s ease-in-out infinite",
        "spin-slow":  "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
