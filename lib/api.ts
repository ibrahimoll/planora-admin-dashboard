import axios from "axios";
import { clearAdminToken, getAdminToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = getAdminToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && axios.isAxiosError(error)) {
      const status = error.response?.status;
      const requestUrl = error.config?.url ?? "";
      const isLoginRequest = requestUrl.includes("/auth/login");
      const isLoginPage = window.location.pathname === "/login";

      if (
        (status === 401 || status === 403) &&
        !isLoginRequest &&
        !isLoginPage
      ) {
        clearAdminToken();
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  },
);
