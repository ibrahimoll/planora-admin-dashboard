"use client";

import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

type StatCardProps = {
  title: string;
  value: string | number;
  detail?: string;
  icon: LucideIcon;
};

export function StatCard({ title, value, detail, icon: Icon }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl border border-cyan-300/15 bg-white/[0.07] p-5 shadow-xl shadow-cyan-950/20 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-white">{value}</h3>
          {detail && <p className="mt-2 text-sm text-cyan-200">{detail}</p>}
        </div>

        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200">
          <Icon size={22} />
        </div>
      </div>
    </motion.div>
  );
}