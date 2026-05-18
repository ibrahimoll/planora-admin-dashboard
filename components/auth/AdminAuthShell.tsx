"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

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
    <main className="min-h-screen bg-[#0b1120] text-white">
      <section className="flex min-h-screen items-center justify-center px-6 py-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-auto w-full max-w-xl"
        >
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-slate-950">
              <ShieldCheck size={22} />
            </div>
            <div>
              <p className="text-3xl font-semibold text-white">Planora</p>
              <p className="mt-1 text-sm text-slate-400">Admin dashboard</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111827] p-7 shadow-sm shadow-black/20">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white md:text-4xl">
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
