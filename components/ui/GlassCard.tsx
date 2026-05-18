import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "purple" | "emerald" | "amber" | "rose" | "none";
};

const glowMap = {
  cyan: "border-cyan-300/15 shadow-cyan-950/10",
  purple: "border-purple-300/15 shadow-purple-950/10",
  emerald: "border-emerald-300/15 shadow-emerald-950/10",
  amber: "border-amber-300/15 shadow-amber-950/10",
  rose: "border-rose-300/20 shadow-rose-950/10",
  none: "border-white/10 shadow-black/20",
};

export function GlassCard({
  children,
  className = "",
  glow = "cyan",
}: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl border bg-[#0d131d]/90 p-6 shadow-xl ${glowMap[glow]} ${className}`}
    >
      {children}
    </div>
  );
}
