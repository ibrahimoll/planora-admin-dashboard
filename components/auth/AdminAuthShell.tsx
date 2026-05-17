"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Binary,
  BrainCircuit,
  Radar,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type AdminAuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

const telemetry = [
  { label: "Auth Gate", value: "Encrypted", icon: ShieldCheck },
  { label: "AI Risk Scan", value: "Live", icon: Radar },
  { label: "Project Intel", value: "Synced", icon: BrainCircuit },
];

export function AdminAuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: AdminAuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050712] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(8,12,24,0.95),rgba(5,7,18,0.92)_45%,rgba(20,8,31,0.82))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.2),transparent_28%),radial-gradient(circle_at_84%_24%,rgba(192,132,252,0.18),transparent_26%),radial-gradient(circle_at_50%_88%,rgba(14,165,233,0.1),transparent_32%)]" />
      <div className="absolute inset-0 opacity-[0.17] [background-image:linear-gradient(rgba(34,211,238,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-transparent via-cyan-300/40 to-transparent lg:block" />

      <section className="relative z-10 grid min-h-screen items-center gap-8 px-6 py-10 lg:grid-cols-[minmax(320px,480px)_minmax(420px,560px)] lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto w-full max-w-xl"
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 text-cyan-200">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 shadow-lg shadow-cyan-500/20">
                <Binary size={22} />
              </div>
              <div>
                <p className="text-3xl font-black uppercase text-cyan-300">
                  Planora
                </p>
                <p className="mt-1 text-xs uppercase text-slate-400">
                  Admin Intelligence Layer
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-white/[0.075] p-7 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300 to-transparent" />
            <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full border border-cyan-300/15" />
            <div className="absolute -bottom-20 left-8 h-40 w-40 rounded-full border border-purple-300/10" />

            <div className="relative">
              <p className="text-xs uppercase text-cyan-300">{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">
                {title}
              </h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                {subtitle}
              </p>

              <div className="mt-8">{children}</div>
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
          className="mx-auto hidden w-full max-w-xl lg:block"
          aria-label="Planora admin telemetry"
        >
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 shadow-2xl shadow-purple-950/30 backdrop-blur-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase text-cyan-300">
                  AI Project Control Dashboard
                </p>
                <h2 className="mt-3 text-3xl font-bold text-white">
                  Secure command access
                </h2>
              </div>
              <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-3 text-cyan-200 shadow-lg shadow-cyan-500/20">
                <Activity size={26} />
              </div>
            </div>

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-[#080b13]/80">
              <div className="grid grid-cols-8 border-b border-white/10">
                {Array.from({ length: 32 }).map((_, index) => (
                  <span
                    key={index}
                    className={`h-9 border-r border-white/5 ${
                      index % 7 === 0
                        ? "bg-cyan-300/15"
                        : index % 5 === 0
                          ? "bg-purple-300/10"
                          : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase text-slate-500">
                      System integrity matrix
                    </p>
                    <p className="mt-2 text-4xl font-black text-white">98.4%</p>
                  </div>
                  <div className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                    Core nominal
                  </div>
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: "16%" }}
                    animate={{ width: ["16%", "74%", "52%", "88%"] }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-purple-300"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {telemetry.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                        <Icon size={18} />
                      </span>
                      <span className="text-sm text-slate-300">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-cyan-100">
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-3xl border border-purple-300/20 bg-purple-400/10 p-5">
              <div className="flex items-start gap-3">
                <Sparkles size={20} className="mt-1 text-purple-200" />
                <p className="text-sm leading-6 text-purple-100">
                  Secure system monitoring and project intelligence for Planora
                  administrators.
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      </section>
    </main>
  );
}
