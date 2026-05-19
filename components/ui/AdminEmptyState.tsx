import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { ReactNode } from "react";

type AdminEmptyStateProps = {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  action?: ReactNode;
};

export function AdminEmptyState({
  icon: Icon = Inbox,
  title = "No records found",
  message = "Data will appear here when records exist.",
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-[#111827] p-8 text-center shadow-[0_0_0_1px_rgba(148,163,184,0.03),0_18px_48px_rgba(0,0,0,0.18)]">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-500/20 bg-teal-500/10 text-teal-300">
        <Icon size={24} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
        {message}
      </p>

      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}