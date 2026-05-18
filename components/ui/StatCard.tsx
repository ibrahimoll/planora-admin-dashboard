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
    glow: "shadow-cyan-950/30",
    icon: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
    text: "text-cyan-200",
    bar: "from-cyan-300 via-cyan-200 to-cyan-400",
    dot: "bg-cyan-300 shadow-cyan-300/70",
  },
  purple: {
    border: "border-purple-300/20",
    glow: "shadow-purple-950/30",
    icon: "border-purple-300/25 bg-purple-300/10 text-purple-200",
    text: "text-purple-200",
    bar: "from-purple-300 via-fuchsia-200 to-purple-400",
    dot: "bg-purple-300 shadow-purple-300/70",
  },
  emerald: {
    border: "border-emerald-300/20",
    glow: "shadow-emerald-950/25",
    icon: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
    text: "text-emerald-200",
    bar: "from-emerald-300 via-cyan-200 to-emerald-400",
    dot: "bg-emerald-300 shadow-emerald-300/70",
  },
  amber: {
    border: "border-amber-300/20",
    glow: "shadow-amber-950/25",
    icon: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    text: "text-amber-200",
    bar: "from-amber-300 via-orange-200 to-amber-400",
    dot: "bg-amber-300 shadow-amber-300/70",
  },
  rose: {
    border: "border-rose-300/20",
    glow: "shadow-rose-950/25",
    icon: "border-rose-300/25 bg-rose-300/10 text-rose-200",
    text: "text-rose-200",
    bar: "from-rose-300 via-red-200 to-rose-400",
    dot: "bg-rose-300 shadow-rose-300/70",
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
      whileHover={{ y: -5, scale: 1.012 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`group relative overflow-hidden rounded-3xl border bg-[linear-gradient(135deg,rgba(255,255,255,0.085),rgba(255,255,255,0.032))] p-5 shadow-2xl backdrop-blur-2xl ${tone.border} ${tone.glow}`}
    >
      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-70" />
      <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-cyan-300/10 blur-3xl transition duration-300 group-hover:bg-cyan-300/16" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full shadow-[0_0_16px_currentColor] ${tone.dot}`}
            />
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
      <div className="relative mt-5 h-1 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ x: "-80%" }}
          animate={{ x: ["-80%", "120%"] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          className={`h-full w-2/3 rounded-full bg-gradient-to-r ${tone.bar}`}
        />
      </div>
      {signal && (
        <p className="relative mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">
          {signal}
        </p>
      )}
    </motion.div>
  );
}
