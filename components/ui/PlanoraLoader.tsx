"use client";

import { motion } from "framer-motion";

type PlanoraLoaderProps = {
  title?: string;
  message?: string;
};

const dots = [0, 1, 2];

export function PlanoraLoader({
  title = "Checking admin access",
  message = "Securing your Planora dashboard session.",
}: PlanoraLoaderProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080d1a] px-6 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(45,212,191,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(45,212,191,0.035)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <motion.div
        aria-hidden="true"
        className="absolute h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: [0.12, 0.24, 0.12],
          scale: [0.9, 1.06, 0.9],
        }}
        transition={{
          duration: 3.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-[2rem] border border-slate-800 bg-[#0d1424]/92 p-8 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      >
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-teal-400/25 bg-teal-400/10">
          <motion.div
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-300/30 bg-[#07111f]"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="absolute h-2.5 w-2.5 rounded-full bg-teal-300 shadow-[0_0_18px_rgba(45,212,191,0.9)]"
              animate={{
                x: [0, 16, 0, -16, 0],
                y: [-16, 0, 16, 0, -16],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <span className="text-xl font-black tracking-tight text-teal-200">
              P
            </span>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.28 }}
          className="mt-7 text-xs font-semibold uppercase tracking-[0.28em] text-teal-300"
        >
          Planora Admin
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.28 }}
          className="mt-3 text-2xl font-bold text-white"
        >
          {title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24, duration: 0.28 }}
          className="mt-3 text-sm leading-6 text-slate-400"
        >
          {message}
        </motion.p>

        <div className="mt-8 flex items-center justify-center gap-2">
          {dots.map((dot) => (
            <motion.span
              key={dot}
              className="h-2.5 w-2.5 rounded-full bg-teal-300"
              animate={{
                opacity: [0.3, 1, 0.3],
                y: [0, -5, 0],
              }}
              transition={{
                duration: 0.9,
                repeat: Infinity,
                delay: dot * 0.12,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-teal-400"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.35,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}