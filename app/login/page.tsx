"use client";

import { api } from "@/lib/api";
import { saveAdminToken } from "@/lib/auth";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

type LoginResponse = {
  access_token: string;
  token_type: string;
};

type CurrentUser = {
  role: "user" | "admin";
};

export default function LoginPage() {
  const router = useRouter();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append("username", emailOrUsername);
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
        localStorage.removeItem("planora_admin_token");
        setError("This account is not an admin account.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError(
        "Invalid credentials, unverified account, or backend is offline.",
      );
    } finally {
      setLoading(false);
    }
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

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm text-slate-300">
                Email or username
              </label>
              <input
                value={emailOrUsername}
                onChange={(event) => setEmailOrUsername(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                placeholder="admin@planora.ai"
              />
            </div>

            <div>
              <label className="text-sm text-slate-300">Password</label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
