"use client";

import { api } from "@/lib/api";
import { clearAdminToken, getAdminToken, saveAdminToken } from "@/lib/auth";
import axios from "axios";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

type CurrentUser = {
  role: "user" | "admin";
  is_active?: boolean;
  is_email_verified?: boolean;
};

function getBackendDetail(data: unknown) {
  if (typeof data === "string") return data;

  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail?: unknown }).detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg?: unknown }).msg ?? "");
          }
          return "";
        })
        .filter(Boolean)
        .join(" ");
    }
  }

  return "";
}

function getLoginErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) {
    return "Backend is offline or unreachable.";
  }

  if (error.response.status === 401) {
    return "Invalid username/email or password.";
  }

  if (error.response.status === 403) {
    return getBackendDetail(error.response.data) || "Access denied.";
  }

  return "Unable to sign in right now.";
}

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
      <main className="min-h-screen overflow-hidden bg-[#060812] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.22),transparent_30%)]" />

        <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-cyan-400/20 bg-white/8 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              Planora Admin
            </p>
            <h1 className="mt-3 text-2xl font-bold">
              Checking admin session...
            </h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#060812] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,255,255,0.22),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.22),transparent_30%)]" />

      <section className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md rounded-3xl border border-cyan-400/20 bg-white/8 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-xl"
        >
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">
              Planora Admin
            </p>
            <h1 className="mt-3 text-3xl font-bold">Operations Center</h1>
            <p className="mt-3 text-sm text-slate-400">
              Secure access for system administrators only.
            </p>
          </div>

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
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                placeholder="admin@planora.ai"
              />
            </div>

            <div>
              <label
                htmlFor="admin-login-password"
                className="text-sm text-slate-300"
              >
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="admin-login-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "admin-login-error" : undefined}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 pr-14 text-white outline-none transition focus:border-cyan-300"
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
              className="w-full rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Authenticating..." : "Enter Command Center"}
            </button>
          </form>
        </motion.div>
      </section>
    </main>
  );
}
