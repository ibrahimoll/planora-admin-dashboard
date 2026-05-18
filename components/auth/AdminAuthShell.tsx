"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Binary } from "lucide-react";

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
    <main className="relative min-h-screen overflow-hidden bg-[#080b12] text-white">
      <div className="planora-grid absolute inset-0 opacity-70" />
      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mx-auto w-full max-w-xl"
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 text-cyan-200">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10">
                <Binary size={22} />
              </div>
              <div>
                <p className="text-3xl font-bold uppercase text-cyan-300">
                  Planora
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">
                  Admin dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-300/15 bg-[#0d131d]/95 p-7 shadow-2xl shadow-black/35">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-6 text-slate-300">{subtitle}</p>

            <div className="mt-8">{children}</div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
