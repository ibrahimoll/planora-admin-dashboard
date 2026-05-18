"use client";

import { motion } from "framer-motion";

type PlanoraLoaderProps = {
  label?: string;
  detail?: string;
  fullScreen?: boolean;
};

export function PlanoraLoader({
  label = "Planora AI Core",
  detail = "Loading project data...",
  fullScreen = true,
}: PlanoraLoaderProps) {
  const content = (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative h-24 w-24">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4.6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-slate-700 border-t-cyan-300"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-3 rounded-full border border-slate-800 border-b-cyan-200/70"
        />
        <motion.div
          animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-10 rounded-full bg-cyan-300"
        />
      </div>

      <p className="mt-7 text-xs uppercase tracking-[0.24em] text-cyan-300">
        {label}
      </p>
      <h1 className="mt-3 max-w-sm text-xl font-semibold leading-tight text-white">
        {detail}
      </h1>
      <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-white/10">
        <motion.div
          animate={{ x: ["-70%", "150%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 rounded-full bg-cyan-300"
        />
      </div>
    </div>
  );

  if (!fullScreen) return content;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b12] px-6 text-white">
      <div className="planora-grid absolute inset-0 opacity-60" />
      <div className="planora-scanline relative z-10 rounded-2xl border border-cyan-300/20 bg-[#0d131d] px-10 py-9 shadow-xl shadow-black/30">
        {content}
      </div>
    </main>
  );
}
