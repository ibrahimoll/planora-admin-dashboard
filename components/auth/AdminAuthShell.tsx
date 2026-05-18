"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import PlanoraLogo from "../PlanoraLogo";

type AdminAuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AdminAuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: AdminAuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080d1a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-160px] top-[-160px] h-[360px] w-[360px] rounded-full bg-[#20d6c7]/20 blur-[120px]" />
        <div className="absolute bottom-[-180px] right-[-140px] h-[380px] w-[380px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(32,214,199,0.08),transparent_36%),linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:auto,48px_48px,48px_48px]" />
      </div>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="w-full max-w-[520px]"
        >
          <div className="mb-8 flex justify-center">
            <PlanoraLogo href="/login" />
          </div>

          <div className="rounded-[2rem] border border-[#1d2942] bg-[#0d1424]/90 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#20d6c7]">
                {eyebrow}
              </p>

              <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                {title}
              </h1>

              <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#a9bad7]">
                {subtitle}
              </p>
            </div>

            {children}

            <div className="mt-7 flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-xs font-medium text-emerald-100">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </span>
              Protected admin access
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-6 text-[#7182a5]">
            Planora Admin Dashboard · Secure access only
          </p>
        </motion.div>
      </section>
    </main>
  );
}