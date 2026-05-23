import { clearAdminProfile } from "@/lib/adminProfileSync";
import { clearAdminToken, getAdminToken } from "@/lib/auth";
import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://192.168.0.104:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function shouldUnwrapPaginatedAdminList(url: string | undefined) {
  if (!url) return false;

  const normalizedUrl = url.split("?")[0];

  return [
    "/admin/users",
    "/admin/projects",
    "/admin/tasks",
    "/admin/logs",
  ].includes(normalizedUrl);
}

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = getAdminToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    const data = response.data as unknown;

    if (
      shouldUnwrapPaginatedAdminList(response.config.url) &&
      data &&
      typeof data === "object" &&
      "items" in data &&
      Array.isArray((data as { items?: unknown }).items)
    ) {
      response.data = (data as { items: unknown[] }).items;
    }

    return response;
  },
  (error) => {
    if (typeof window !== "undefined" && axios.isAxiosError(error)) {
      const status = error.response?.status;
      const requestUrl = error.config?.url ?? "";

      const isPublicAuthRequest =
        requestUrl.includes("/auth/login") ||
        requestUrl.includes("/auth/forgot-password") ||
        requestUrl.includes("/auth/reset-password");

      const isLoginPage = window.location.pathname === "/login";

      if (
        (status === 401 || status === 403) &&
        !isPublicAuthRequest &&
        !isLoginPage
      ) {
        clearAdminToken();
        clearAdminProfile();
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);
