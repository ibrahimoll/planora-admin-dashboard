"use client";

import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { AdminAuthShell } from "@/components/auth/AdminAuthShell";
import { PlanoraLoader } from "@/components/ui/PlanoraLoader";
import { api } from "@/lib/api";
import { getLoginErrorMessage } from "@/lib/auth-errors";
import { clearAdminToken, getAdminToken, saveAdminToken } from "@/lib/auth";
import {
  clearAdminProfile,
  saveAdminProfile,
  type AdminUser,
} from "@/lib/adminProfileSync";
import { registerCurrentBrowserForPush } from "@/lib/registerPushToken";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

type CurrentUser = AdminUser & {
  role: "user" | "admin";
  is_active?: boolean;
  is_email_verified?: boolean;
};

function isActiveAdmin(user: CurrentUser) {
  return (
    user.role === "admin" &&
    user.is_active !== false &&
    user.is_email_verified !== false
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function redirectAuthenticatedAdmin() {
      const token = getAdminToken();

      if (!token) {
        if (isMounted) setCheckingSession(false);
        return;
      }

      try {
        const response = await api.get<CurrentUser>("/auth/me");

        if (isActiveAdmin(response.data)) {
          saveAdminProfile(response.data);
          router.replace("/dashboard");
          return;
        }

        clearAdminToken();
        clearAdminProfile();
      } catch {
        clearAdminToken();
        clearAdminProfile();
      }

      if (isMounted) setCheckingSession(false);
    }

    redirectAuthenticatedAdmin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const identifier = emailOrUsername.trim();

    if (!identifier && !password) {
      setError("Enter your email/username and password.");
      return;
    }

    if (!identifier) {
      setError("Enter your email or username.");
      return;
    }

    if (!password) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", identifier);
      formData.append("password", password);

      const loginResponse = await api.post<LoginResponse>(
        "/auth/login",
        formData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      saveAdminToken(loginResponse.data.access_token);

      const meResponse = await api.get<CurrentUser>("/auth/me");

      if (meResponse.data.role !== "admin") {
        clearAdminToken();
        clearAdminProfile();
        setError("This account is not an admin account.");
        return;
      }

      if (!isActiveAdmin(meResponse.data)) {
        clearAdminToken();
        clearAdminProfile();
        setError("This admin account is not active or verified.");
        return;
      }

      saveAdminProfile(meResponse.data);
      void registerCurrentBrowserForPush();
      router.replace("/dashboard");
    } catch (loginError) {
      clearAdminToken();
      clearAdminProfile();
      setError(getLoginErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <PlanoraLoader
        label="Loading Planora..."
        detail="Checking admin session..."
      />
    );
  }

  return (
    <AdminAuthShell
      eyebrow="Admin access"
      title="Welcome back"
      subtitle="Sign in with your Planora admin account to manage the dashboard."
    >
      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="admin-login-identifier"
            className="text-sm font-medium text-[#d8e2f5]"
          >
            Email or username
          </label>

          <div className="relative mt-2">
            <Mail
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7182a5]"
            />

            <input
              id="admin-login-identifier"
              value={emailOrUsername}
              onChange={(event) => setEmailOrUsername(event.target.value)}
              autoComplete="username"
              autoFocus
              disabled={loading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-login-error" : undefined}
              className="h-14 w-full rounded-2xl border border-[#1d2942] bg-[#080d1a] pl-12 pr-4 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-[#7182a5] focus:border-[#20d6c7]/80 focus:bg-[#0a1120] focus:shadow-[0_0_0_4px_rgba(32,214,199,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="admin@planora.ai"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="admin-login-password"
              className="text-sm font-medium text-[#d8e2f5]"
            >
              Password
            </label>

            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[#20d6c7] transition hover:text-white"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative mt-2">
            <LockKeyhole
              size={19}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7182a5]"
            />

            <input
              id="admin-login-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={loading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-login-error" : undefined}
              className="h-14 w-full rounded-2xl border border-[#1d2942] bg-[#080d1a] pl-12 pr-14 text-sm font-medium text-white outline-none transition-all duration-200 placeholder:text-[#7182a5] focus:border-[#20d6c7]/80 focus:bg-[#0a1120] focus:shadow-[0_0_0_4px_rgba(32,214,199,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Enter your password"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-[#1d2942] bg-[#0d1424] text-[#8ea3c7] transition hover:border-[#20d6c7]/50 hover:text-[#20d6c7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error ? (
          <p
            id="admin-login-error"
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#20d6c7] px-4 text-sm font-semibold text-[#06111f] shadow-[0_18px_40px_rgba(32,214,199,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5eead4] hover:shadow-[0_22px_55px_rgba(32,214,199,0.22)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={19} className="animate-spin" />
              Authenticating admin...
            </>
          ) : (
            <>
              Login to dashboard
              <LockKeyhole
                size={18}
                className="transition-transform duration-200 group-hover:scale-110"
              />
            </>
          )}
        </button>
      </form>
    </AdminAuthShell>
  );
}
