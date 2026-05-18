import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "purple" | "rose" | "none";
};

const glowMap = {
  cyan: "shadow-cyan-950/30 before:from-cyan-300/30",
  purple: "shadow-purple-950/30 before:from-purple-300/30",
  rose: "shadow-rose-950/30 before:from-rose-300/30",
  none: "shadow-black/30 before:from-white/10",
};

export function GlassCard({
  children,
  className = "",
  glow = "cyan",
}: GlassCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.035))] p-6 shadow-2xl backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:bg-gradient-to-r before:via-white/40 before:to-transparent after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_90%_18%,rgba(192,132,252,0.1),transparent_30%)] after:opacity-80 ${glowMap[glow]} ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
