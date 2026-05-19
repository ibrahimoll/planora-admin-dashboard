"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  RotateCcw,
} from "lucide-react";
import { AdminAuthShell } from "@/components/auth/AdminAuthShell";
import { api } from "@/lib/api";
import { getAuthRequestErrorMessage } from "@/lib/auth-errors";

type MessageResponse = {
  message: string;
};

function validateResetForm({
  email,
  code,
  newPassword,
  confirmPassword,
}: {
  email: string;
  code: string;
  newPassword: string;
  confirmPassword: string;
}) {
  if (!email) return "Enter your admin email address.";
  if (!/^\d{6}$/.test(code)) return "Enter the 6-digit reset code.";

  if (newPassword.length < 8) {
    return "New password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(newPassword)) {
    return "New password must contain at least one uppercase letter.";
  }

  if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(newPassword)) {
    return "New password must contain at least one symbol.";
  }

  if (confirmPassword !== newPassword) {
    return "Confirm password must match the new password.";
  }

  return "";
}

export default function ResetPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");

  const [loading, setLoading] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const emailFromUrl = params.get("email");

      if (emailFromUrl) {
        setEmail(emailFromUrl);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  async function handleResendCode() {
    setError("");
    setSuccess("");
    setResendSuccess("");

    const emailValue = email.trim();

    if (!emailValue) {
      setError("Enter your admin email first, then request another code.");
      return;
    }

    setResendingCode(true);

    try {
      await api.post<MessageResponse>("/auth/forgot-password", {
        email: emailValue,
      });

      setResendSuccess("A new reset code has been sent to your email.");
    } catch (requestError) {
      setError(
        getAuthRequestErrorMessage(
          requestError,
          "Unable to resend reset code right now.",
        ),
      );
    } finally {
      setResendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setResendSuccess("");

    const emailValue = email.trim();
    const codeValue = code.trim();

    const validationError = validateResetForm({
      email: emailValue,
      code: codeValue,
      newPassword,
      confirmPassword,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await api.post<MessageResponse>("/auth/reset-password", {
        email: emailValue,
        code: codeValue,
        new_password: newPassword,
      });

      setSuccess("Password reset successfully. Redirecting to login...");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push("/login");
      }, 900);
    } catch (requestError) {
      setError(
        getAuthRequestErrorMessage(
          requestError,
          "Unable to reset password right now.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminAuthShell
      eyebrow="New password"
      title="Set a new password"
      subtitle="Enter your email, 6-digit reset code, and new admin password."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="reset-password-email"
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
              id="reset-password-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="text"
              inputMode="email"
              autoComplete="email"
              disabled={loading || resendingCode}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-password-error" : undefined}
              className="h-14 w-full rounded-2xl border border-[#1d2942] bg-[#080d1a] pl-12 pr-4 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-[#7182a5] focus:border-[#20d6c7]/80 focus:bg-[#0a1120] focus:shadow-[0_0_0_4px_rgba(32,214,199,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="admin@planora.ai"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reset-password-code"
            className="text-sm font-medium text-[#d8e2f5]"
          >
            Reset code
          </label>

          <div className="relative mt-2">
            <KeyRound
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7182a5]"
            />

            <input
              id="reset-password-code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              disabled={loading || resendingCode}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-password-error" : undefined}
              className="h-14 w-full rounded-2xl border border-[#1d2942] bg-[#080d1a] pl-12 pr-4 text-center text-lg font-semibold tracking-[0.32em] text-white outline-none transition-all duration-200 placeholder:text-[#7182a5] focus:border-[#20d6c7]/80 focus:bg-[#0a1120] focus:shadow-[0_0_0_4px_rgba(32,214,199,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="000000"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="reset-password-new"
            className="text-sm font-medium text-[#d8e2f5]"
          >
            New password
          </label>

          <div className="relative mt-2">
            <LockKeyhole
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7182a5]"
            />

            <input
              id="reset-password-new"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type={showNewPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={loading || resendingCode}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-password-error" : undefined}
              className="h-14 w-full rounded-2xl border border-[#1d2942] bg-[#080d1a] pl-12 pr-14 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-[#7182a5] focus:border-[#20d6c7]/80 focus:bg-[#0a1120] focus:shadow-[0_0_0_4px_rgba(32,214,199,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="At least 8 chars, uppercase, symbol"
            />

            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              disabled={loading || resendingCode}
              aria-label={showNewPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-[#1d2942] bg-[#0d1424] text-[#8ea3c7] transition hover:border-[#20d6c7]/50 hover:text-[#20d6c7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="reset-password-confirm"
            className="text-sm font-medium text-[#d8e2f5]"
          >
            Confirm password
          </label>

          <div className="relative mt-2">
            <LockKeyhole
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7182a5]"
            />

            <input
              id="reset-password-confirm"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              disabled={loading || resendingCode}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-password-error" : undefined}
              className="h-14 w-full rounded-2xl border border-[#1d2942] bg-[#080d1a] pl-12 pr-14 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-[#7182a5] focus:border-[#20d6c7]/80 focus:bg-[#0a1120] focus:shadow-[0_0_0_4px_rgba(32,214,199,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Repeat new password"
            />

            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              disabled={loading || resendingCode}
              aria-label={
                showConfirmPassword ? "Hide password" : "Show password"
              }
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-[#1d2942] bg-[#0d1424] text-[#8ea3c7] transition hover:border-[#20d6c7]/50 hover:text-[#20d6c7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error ? (
          <p
            id="reset-password-error"
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        {resendSuccess ? (
          <div
            role="status"
            className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-cyan-200" />
              <p>{resendSuccess}</p>
            </div>
          </div>
        ) : null}

        {success ? (
          <div
            role="status"
            className="rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0 text-emerald-200"
              />
              <p>{success}</p>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || resendingCode}
          className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#20d6c7] px-4 text-sm font-semibold text-[#06111f] shadow-[0_18px_40px_rgba(32,214,199,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5eead4] hover:shadow-[0_22px_55px_rgba(32,214,199,0.22)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              Updating password...
            </>
          ) : (
            <>
              Reset admin password
              <LockKeyhole
                size={18}
                className="transition-transform duration-200 group-hover:scale-110"
              />
            </>
          )}
        </button>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={loading || resendingCode}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1d2942] bg-[#0d1424] px-4 py-3 font-medium text-[#20d6c7] transition hover:border-[#20d6c7]/50 hover:bg-[#20d6c7]/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resendingCode ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RotateCcw size={16} />
                Resend code
              </>
            )}
          </button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#1d2942] bg-[#0d1424] px-4 py-3 font-medium text-[#a9bad7] transition hover:border-[#20d6c7]/50 hover:bg-[#101a2d] hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>
      </form>
    </AdminAuthShell>
  );
}
