"use client";

import { motion } from "framer-motion";

type PlanoraLoaderProps = {
  label?: string;
  detail?: string;
  fullScreen?: boolean;
};

export function PlanoraLoader({
  label = "Planora AI Core",
  detail = "Synchronizing project intelligence…",
  fullScreen = true,
}: PlanoraLoaderProps) {
  const content = (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.16),transparent_62%)] blur-sm" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 5.4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-cyan-300/15 border-t-cyan-300 shadow-[0_0_42px_rgba(34,211,238,0.28)]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 7.2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-purple-300/15 border-b-purple-300 shadow-[0_0_30px_rgba(192,132,252,0.18)]"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-8 rounded-full border border-dashed border-cyan-200/35"
        />
        <motion.div
          animate={{ scale: [0.82, 1.08, 0.82], opacity: [0.58, 1, 0.58] }}
          transition={{ duration: 2.35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-[2.75rem] rounded-full bg-cyan-300 shadow-[0_0_48px_rgba(34,211,238,0.8)]"
        />
        <motion.span
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-16 rounded-full bg-purple-200 shadow-[0_0_22px_rgba(216,180,254,0.9)]"
        />
      </div>

      <p className="mt-7 text-xs uppercase tracking-[0.34em] text-cyan-300">
        {label}
      </p>
      <h1 className="mt-3 max-w-sm text-2xl font-bold leading-tight text-white">
        {detail}
      </h1>
      <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-white/10 shadow-inner shadow-black/40">
        <motion.div
          animate={{ x: ["-70%", "150%"] }}
          transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 rounded-full bg-gradient-to-r from-transparent via-cyan-300 to-purple-300"
        />
      </div>
    </div>
  );

  if (!fullScreen) return content;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050712] px-6 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,12,24,0.96),rgba(5,7,18,0.92)_48%,rgba(20,8,31,0.82))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,211,238,0.2),transparent_30%),radial-gradient(circle_at_78%_76%,rgba(192,132,252,0.16),transparent_32%)]" />
      <div className="planora-grid absolute inset-0 opacity-[0.14]" />
      <div className="planora-scanline relative z-10 rounded-3xl border border-cyan-300/20 bg-white/[0.06] px-10 py-9 shadow-2xl shadow-cyan-950/35 backdrop-blur-2xl">
        {content}
      </div>
    </main>
  );
}
