"use client";

import { motion } from "framer-motion";

type PlanoraLoaderProps = {
  label?: string;
  detail?: string;
  fullScreen?: boolean;
};

export function PlanoraLoader({
  label = "Loading Planora...",
  detail = "Loading project data...",
  fullScreen = true,
}: PlanoraLoaderProps) {
  const content = (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-[#111827]">
        <motion.span
          animate={{ scale: [1, 0.72, 1], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
          className="h-3 w-3 rounded-full bg-teal-400"
        />
      </div>

      <p className="mt-6 text-sm font-semibold text-white">{label}</p>
      <p className="mt-2 max-w-xs text-sm leading-6 text-slate-400">{detail}</p>
      <div className="mt-6 h-1 w-52 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          animate={{ x: ["-70%", "150%"] }}
          transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 rounded-full bg-teal-400"
        />
      </div>
    </div>
  );

  if (!fullScreen) return content;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1120] px-6 text-white">
      <div className="rounded-2xl border border-slate-800 bg-[#111827] px-10 py-9 shadow-sm shadow-black/20">
        {content}
      </div>
    </main>
  );
}
