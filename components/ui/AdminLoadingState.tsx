"use client";

import { motion } from "framer-motion";

type AdminLoadingStateProps = {
  title?: string;
  message?: string;
  rows?: number;
  variant?: "card" | "page";
};

export function AdminLoadingState({
  title = "Loading data",
  message = "Fetching the latest Planora records.",
  rows = 3,
  variant = "card",
}: AdminLoadingStateProps) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-700/70 bg-[#111827] shadow-[0_0_0_1px_rgba(148,163,184,0.03),0_18px_48px_rgba(0,0,0,0.18)]",
        variant === "page" ? "p-8" : "p-5",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10">
          <motion.span
            className="absolute h-2.5 w-2.5 rounded-full bg-teal-300"
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [0.8, 1.15, 0.8],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <span className="h-5 w-5 rounded-full border border-teal-300/30" />
        </div>

        <div>
          <p className="font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{message}</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <motion.div
            key={index}
            className="h-12 overflow-hidden rounded-xl border border-slate-800 bg-slate-950/45"
            initial={{ opacity: 0.45 }}
            animate={{ opacity: [0.45, 0.85, 0.45] }}
            transition={{
              duration: 1.15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.08,
            }}
          >
            <div className="h-full w-1/2 rounded-xl bg-slate-800/50" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}