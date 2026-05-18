"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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
  if (!/[!\"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(newPassword)) {
    return "New password must contain at least one symbol.";
  }
  if (confirmPassword !== newPassword) {
    return "Confirm password must match the new password.";
  }

  return "";
}

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

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
      setSuccess("Password reset successfully. You can now sign in.");
      setNewPassword("");
      setConfirmPassword("");
      setCode("");
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
      title="Set a new admin password"
      subtitle="Enter the email, reset code, and new password for the admin account."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="reset-password-email" className="text-sm text-slate-300">
            Admin email
          </label>
          <input
            id="reset-password-email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="text"
            inputMode="email"
            autoComplete="email"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "reset-password-error" : undefined}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
            placeholder="admin@planora.ai"
          />
        </div>

        <div>
          <label htmlFor="reset-password-code" className="text-sm text-slate-300">
            Reset code
          </label>
          <input
            id="reset-password-code"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "reset-password-error" : undefined}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
            placeholder="123456"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="reset-password-new"
              className="text-sm text-slate-300"
            >
              New password
            </label>
            <input
              id="reset-password-new"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-password-error" : undefined}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
              placeholder="NewPass123!"
            />
          </div>

          <div>
            <label
              htmlFor="reset-password-confirm"
              className="text-sm text-slate-300"
            >
              Confirm password
            </label>
            <input
              id="reset-password-confirm"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "reset-password-error" : undefined}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
              placeholder="Repeat password"
            />
          </div>
        </div>

        {error && (
          <p
            id="reset-password-error"
            role="alert"
            className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        {success && (
          <div
            role="status"
            className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
          >
            <div className="flex gap-3">
              <CheckCircle2 size={18} className="mt-0.5 text-emerald-200" />
              <p>{success}</p>
            </div>
          </div>
        )}

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-200 hover:shadow-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Updating password..." : "Reset admin password"}
        </button>

        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-slate-300 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Request another code
          </Link>
          <Link
            href="/login"
            className="font-medium text-cyan-200 transition hover:text-white"
          >
            Back to login
          </Link>
        </div>
      </form>
    </AdminAuthShell>
  );
}
