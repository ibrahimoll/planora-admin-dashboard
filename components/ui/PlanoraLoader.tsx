"use client";

import { motion } from "framer-motion";

type PlanoraLoaderProps = {
  label?: string;
  detail?: string;
  fullScreen?: boolean;
};

export function PlanoraLoader({
  label = "Planora AI Core",
  detail = "Synchronizing project intelligence...",
  fullScreen = true,
}: PlanoraLoaderProps) {
  const content = (
    <div className="relative flex flex-col items-center text-center">
      <div className="relative h-28 w-28">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-cyan-300/20 border-t-cyan-300 shadow-[0_0_34px_rgba(34,211,238,0.22)]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-purple-300/20 border-b-purple-300"
        />
        <motion.div
          animate={{ scale: [0.82, 1.05, 0.82], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-9 rounded-full bg-cyan-300 shadow-[0_0_42px_rgba(34,211,238,0.8)]"
        />
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.18),transparent_58%)]" />
      </div>

      <p className="mt-7 text-sm uppercase text-cyan-300">{label}</p>
      <h1 className="mt-3 text-2xl font-bold text-white">{detail}</h1>
      <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(34,211,238,0.18),transparent_30%),radial-gradient(circle_at_78%_76%,rgba(192,132,252,0.14),transparent_32%)]" />
      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(34,211,238,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.12)_1px,transparent_1px)] [background-size:46px_46px]" />
      <div className="relative z-10 rounded-3xl border border-cyan-300/20 bg-white/[0.06] px-10 py-9 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
        {content}
      </div>
    </main>
  );
}
