"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  dangerText?: string;
  loading?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  dangerText,
  loading = false,
  children,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Close confirmation dialog"
            onClick={loading ? undefined : onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-3xl border border-rose-500/25 bg-[#111827] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.55)]"
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 text-slate-400 transition hover:border-rose-500/40 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close"
            >
              <X size={17} />
            </button>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-300">
              <AlertTriangle size={22} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">{title}</h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">{message}</p>

            {dangerText ? (
              <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {dangerText}
              </div>
            ) : null}

            {children ? <div className="mt-5">{children}</div> : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLabel}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-500 bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : null}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}