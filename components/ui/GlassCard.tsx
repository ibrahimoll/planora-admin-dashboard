import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-xl shadow-black/30 backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}