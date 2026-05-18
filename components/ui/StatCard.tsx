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
    marker: "bg-teal-400",
    icon: "border-teal-500/20 bg-teal-500/10 text-teal-200",
    text: "text-teal-200",
  },
  purple: {
    marker: "bg-violet-400",
    icon: "border-violet-500/20 bg-violet-500/10 text-violet-200",
    text: "text-violet-200",
  },
  emerald: {
    marker: "bg-emerald-400",
    icon: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    text: "text-emerald-200",
  },
  amber: {
    marker: "bg-amber-400",
    icon: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    text: "text-amber-200",
  },
  rose: {
    marker: "bg-rose-400",
    icon: "border-rose-500/20 bg-rose-500/10 text-rose-200",
    text: "text-rose-200",
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
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-sm shadow-black/20"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${tone.marker}`} />
            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {title}
            </p>
          </div>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {value}
          </h3>
          {detail && (
            <p className={`mt-2 text-sm font-medium ${tone.text}`}>{detail}</p>
          )}
        </div>

        <div className={`rounded-xl border p-2.5 ${tone.icon}`}>
          <Icon size={20} />
        </div>
      </div>
      {signal && <p className="mt-5 text-sm text-slate-400">{signal}</p>}
    </motion.div>
  );
}
