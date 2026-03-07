import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

// ── BUTTON ─────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "ghost" | "outline" | "danger";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-[10px] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

    const variants: Record<ButtonVariant, string> = {
      primary: "text-white bg-grad-blue shadow-blue hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(26,86,219,0.45)]",
      ghost:   "text-white/80 bg-white/[0.07] border border-white/15 hover:bg-white/[0.12] hover:text-white hover:border-white/25",
      outline: "text-blue border-[1.5px] border-blue bg-white hover:bg-blue-light hover:-translate-y-px",
      danger:  "text-danger border-[1.5px] border-danger/25 bg-white hover:bg-danger-light",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "px-3.5 py-1.5 text-[13px]",
      md: "px-5 py-2.5 text-[14px]",
      lg: "px-7 py-3.5 text-[15px] font-bold",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg className="w-4 h-4 animate-spin-slow" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="10" cy="10" r="7" strokeDasharray="22 22" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

// ── BADGE ──────────────────────────────────────────────────────────────────
type BadgeVariant = "blue" | "green" | "purple" | "amber" | "red" | "gray";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  mono?: boolean;
}

export function Badge({ variant = "gray", mono, className, children }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    blue:   "bg-blue-light text-blue border border-blue/20",
    green:  "bg-green-light text-green border border-green/20",
    purple: "bg-purple-light text-purple border border-purple/20",
    amber:  "bg-amber-light text-amber border border-amber/25",
    red:    "bg-danger-light text-danger border border-danger/20",
    gray:   "bg-surface-3 text-ink-4 border border-border",
  };

  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded text-[11px] font-semibold",
        mono && "font-mono",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ── CARD ───────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  accentColor?: string;
}

export function Card({ children, className, hover, accentColor }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-border rounded-2xl p-7 shadow-sm",
        hover && "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-border-2",
        className
      )}
      style={accentColor ? { borderTopColor: accentColor, borderTopWidth: 3 } : undefined}
    >
      {children}
    </div>
  );
}

// ── SECTION HEADER ─────────────────────────────────────────────────────────
interface SectionHeaderProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  light?: boolean;
  className?: string;
}

export function SectionHeader({ eyebrow, title, subtitle, light, className }: SectionHeaderProps) {
  return (
    <div className={cn("reveal", className)}>
      <span
        className={cn(
          "block font-mono text-[11.5px] font-medium tracking-[1.2px] uppercase mb-3",
          light ? "text-blue-muted" : "text-blue"
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          "font-syne text-[clamp(28px,4vw,44px)] font-extrabold tracking-[-1px] leading-[1.1]",
          light ? "text-white" : "text-ink"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={cn("text-[17px] leading-relaxed mt-3.5 max-w-[540px]", light ? "text-white/60" : "text-ink-4")}>
          {subtitle}
        </p>
      )}
      <div className="w-10 h-[3px] bg-grad-blue rounded-full mt-4" />
    </div>
  );
}
