"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminAuthShell } from "@/components/auth/AdminAuthShell";
import { PlanoraLoader } from "@/components/ui/PlanoraLoader";
import { api } from "@/lib/api";
import { getLoginErrorMessage } from "@/lib/auth-errors";
import { clearAdminToken, getAdminToken, saveAdminToken } from "@/lib/auth";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

type CurrentUser = {
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
          router.replace("/dashboard");
          return;
        }

        clearAdminToken();
      } catch {
        clearAdminToken();
      }

      if (isMounted) setCheckingSession(false);
    }

    redirectAuthenticatedAdmin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const identifier = emailOrUsername.trim();
    const passwordValue = password.trim();

    if (!identifier && !passwordValue) {
      setError("Enter your email/username and password.");
      return;
    }

    if (!identifier) {
      setError("Enter your email or username.");
      return;
    }

    if (!passwordValue) {
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
        setError("This account is not an admin account.");
        return;
      }

      if (!isActiveAdmin(meResponse.data)) {
        clearAdminToken();
        setError("This admin account is not active.");
        return;
      }

      router.replace("/dashboard");
    } catch (loginError) {
      clearAdminToken();
      setError(getLoginErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <PlanoraLoader
        label="Planora Admin Core"
        detail="Checking admin session..."
      />
    );
  }

  return (
    <AdminAuthShell
      eyebrow="AI Project Control Dashboard"
      title="Planora Admin Portal"
      subtitle="Secure system monitoring and project intelligence for Planora administrators."
    >
      <form onSubmit={handleLogin} className="space-y-5" noValidate>
        <div>
          <label
            htmlFor="admin-login-identifier"
            className="text-sm text-slate-300"
          >
            Email or username
          </label>
          <input
            id="admin-login-identifier"
            value={emailOrUsername}
            onChange={(event) => setEmailOrUsername(event.target.value)}
            autoComplete="username"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "admin-login-error" : undefined}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
            placeholder="admin@planora.ai"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <label
              htmlFor="admin-login-password"
              className="text-sm text-slate-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-cyan-200 transition hover:text-white"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-2">
            <input
              id="admin-login-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "admin-login-error" : undefined}
              className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 pr-14 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]"
              placeholder="********"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100 transition hover:bg-cyan-300/20"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <p
            id="admin-login-error"
            role="alert"
            className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-200 hover:shadow-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Authenticating admin..." : "Access Admin Dashboard"}
        </button>
      </form>
    </AdminAuthShell>
  );
}
