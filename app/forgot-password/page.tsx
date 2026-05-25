"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Mail,
  MailCheck,
  Send,
} from "lucide-react";
import { AdminAuthShell } from "@/components/auth/AdminAuthShell";
import { api } from "@/lib/api";
import { getAuthRequestErrorMessage } from "@/lib/auth-errors";

type MessageResponse = {
  message: string;
};

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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

      setSuccess("Reset code sent. Check your email inbox.");

      router.push(`/reset-password?email=${encodeURIComponent(emailValue)}`);
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
      eyebrow="Password reset"
      title="Recover admin access"
      subtitle="Enter your Planora admin email and we will send a 6-digit reset code."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="forgot-password-email"
            className="text-sm font-medium text-[#d8e2f5]"
          >
            Admin email
          </label>

          <div className="relative mt-2">
            <Mail
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7182a5]"
            />

            <input
              id="forgot-password-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="text"
              inputMode="email"
              autoComplete="email"
              autoFocus
              disabled={loading}
              aria-invalid={Boolean(error)}
              aria-describedby={
                error
                  ? "forgot-password-error"
                  : success
                    ? "forgot-password-success"
                    : undefined
              }
              className="h-14 w-full rounded-2xl border border-[#1d2942] bg-[#080d1a] pl-12 pr-4 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-[#7182a5] focus:border-[#20d6c7]/80 focus:bg-[#0a1120] focus:shadow-[0_0_0_4px_rgba(32,214,199,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="admin@planora.ai"
            />
          </div>
        </div>

        {error ? (
          <p
            id="forgot-password-error"
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        {success ? (
          <div
            id="forgot-password-success"
            role="status"
            className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
          >
            <div className="flex items-start gap-3">
              <MailCheck
                size={18}
                className="mt-0.5 shrink-0 text-emerald-200"
              />
              <p>{success}</p>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#20d6c7] px-4 text-sm font-semibold text-[#06111f] shadow-[0_18px_40px_rgba(32,214,199,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5eead4] hover:shadow-[0_22px_55px_rgba(32,214,199,0.22)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              Sending reset code...
            </>
          ) : (
            <>
              Send reset code
              <Send
                size={18}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>

        <div className="flex items-center justify-start gap-4 text-sm">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 font-medium text-[#a9bad7] transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      </form>
    </AdminAuthShell>
  );
}
