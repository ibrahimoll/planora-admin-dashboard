import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "purple" | "emerald" | "amber" | "rose" | "none";
};

const toneMap = {
  cyan: "border-teal-500/20 shadow-[0_0_0_1px_rgba(45,212,191,0.04),0_18px_48px_rgba(0,0,0,0.2)]",
  purple:
    "border-violet-500/20 shadow-[0_0_0_1px_rgba(139,92,246,0.04),0_18px_48px_rgba(0,0,0,0.2)]",
  emerald:
    "border-emerald-500/20 shadow-[0_0_0_1px_rgba(16,185,129,0.04),0_18px_48px_rgba(0,0,0,0.2)]",
  amber:
    "border-amber-500/20 shadow-[0_0_0_1px_rgba(245,158,11,0.04),0_18px_48px_rgba(0,0,0,0.2)]",
  rose: "border-rose-500/20 shadow-[0_0_0_1px_rgba(244,63,94,0.04),0_18px_48px_rgba(0,0,0,0.2)]",
  none: "border-slate-700/70 shadow-[0_0_0_1px_rgba(148,163,184,0.03),0_18px_48px_rgba(0,0,0,0.18)]",
};

export function GlassCard({
  children,
  className = "",
  glow = "none",
}: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-[#111827] p-6 ${toneMap[glow]} ${className}`}
    >
      {children}
    </div>
  );
}