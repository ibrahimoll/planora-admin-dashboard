"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { AdminAuthShell } from "@/components/auth/AdminAuthShell";
import { api } from "@/lib/api";
import { getAuthRequestErrorMessage } from "@/lib/auth-errors";

type MessageResponse = {
  message: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const emailValue = email.trim();

    if (!emailValue) {
      setError("Enter your admin email address.");
      return;
    }

    setLoading(true);

    try {
      await api.post<MessageResponse>("/auth/forgot-password", {
        email: emailValue,
      });
      setSuccess("If an account with that email exists, a reset code has been sent.");
    } catch (requestError) {
      setError(
        getAuthRequestErrorMessage(
          requestError,
          "Unable to request a password reset right now.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthShell
      eyebrow="Credential Recovery"
      title="Recover Admin Access"
      subtitle="Request a secure reset code for your Planora administrator account."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="forgot-password-email" className="text-sm text-slate-300">
            Admin email
          </label>
          <input
            id="forgot-password-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="text"
            inputMode="email"
            autoComplete="email"
            aria-invalid={Boolean(error)}
            aria-describedby={
              error
                ? "forgot-password-error"
                : success
                  ? "forgot-password-success"
                  : undefined
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
            placeholder="admin@planora.ai"
          />
        </div>

        {error && (
          <p
            id="forgot-password-error"
            role="alert"
            className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        {success && (
          <div
            id="forgot-password-success"
            role="status"
            className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
          >
            <div className="flex gap-3">
              <MailCheck size={18} className="mt-0.5 text-emerald-200" />
              <p>{success}</p>
            </div>
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-200 hover:shadow-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Sending reset code..." : "Send Reset Code"}
        </button>

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
          <Link
            href="/reset-password"
            className="font-medium text-cyan-200 transition hover:text-white"
          >
            Enter reset code
          </Link>
        </div>
      </form>
    </AdminAuthShell>
  );
}
