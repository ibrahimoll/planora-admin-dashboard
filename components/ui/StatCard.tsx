"use client";

import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type StatCardProps = {
  title: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
  accent?: "cyan" | "purple" | "emerald" | "amber" | "rose";
  signal?: string;
};

const accentMap = {
  cyan: {
    border: "border-cyan-300/20",
    glow: "shadow-cyan-950/10",
    icon: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
    text: "text-cyan-200",
    dot: "bg-cyan-300",
  },
  purple: {
    border: "border-purple-300/20",
    glow: "shadow-purple-950/10",
    icon: "border-purple-300/20 bg-purple-300/10 text-purple-200",
    text: "text-purple-200",
    dot: "bg-purple-300",
  },
  emerald: {
    border: "border-emerald-300/20",
    glow: "shadow-emerald-950/10",
    icon: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
    text: "text-emerald-200",
    dot: "bg-emerald-300",
  },
  amber: {
    border: "border-amber-300/20",
    glow: "shadow-amber-950/10",
    icon: "border-amber-300/20 bg-amber-300/10 text-amber-200",
    text: "text-amber-200",
    dot: "bg-amber-300",
  },
  rose: {
    border: "border-rose-300/20",
    glow: "shadow-rose-950/10",
    icon: "border-rose-300/20 bg-rose-300/10 text-rose-200",
    text: "text-rose-200",
    dot: "bg-rose-300",
  },
};

export function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  accent = "cyan",
  signal,
}: StatCardProps) {
  const tone = accentMap[accent];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`rounded-2xl border bg-[#0d131d]/90 p-5 shadow-xl ${tone.border} ${tone.glow}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
              {title}
            </p>
          </div>
          <h3 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
            {value}
          </h3>
          {detail && (
            <p className={`mt-2 text-sm font-medium ${tone.text}`}>{detail}</p>
          )}
        </div>

        <div className={`rounded-2xl border p-3 ${tone.icon}`}>
          <Icon size={22} />
        </div>
      </div>
      {signal && (
        <p className="mt-5 text-xs uppercase tracking-[0.18em] text-slate-500">
          {signal}
        </p>
      )}
    </motion.div>
  );
}
