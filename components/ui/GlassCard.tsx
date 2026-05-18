import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "purple" | "emerald" | "amber" | "rose" | "none";
};

const toneMap = {
  cyan: "border-slate-800",
  purple: "border-slate-800",
  emerald: "border-emerald-500/20",
  amber: "border-amber-500/20",
  rose: "border-rose-500/20",
  none: "border-slate-800",
};

export function GlassCard({
  children,
  className = "",
  glow = "none",
}: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-[#111827] p-6 shadow-sm shadow-black/20 ${toneMap[glow]} ${className}`}
    >
      {children}
    </div>
  );
}
