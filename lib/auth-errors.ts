import axios from "axios";

export function getBackendDetail(data: unknown) {
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

export function getLoginErrorMessage(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) {
    return "Backend is offline or unreachable.";
  }

  if (error.response.status === 401) {
    return "Invalid username/email or password.";
  }

  if (error.response.status === 403) {
    return getBackendDetail(error.response.data) || "Access denied.";
  }

  return getBackendDetail(error.response.data) || "Unable to sign in right now.";
}

export function getAuthRequestErrorMessage(
  error: unknown,
  fallback = "Unable to complete request right now.",
) {
  if (!axios.isAxiosError(error) || !error.response) {
    return "Backend is offline or unreachable.";
  }

  return getBackendDetail(error.response.data) || fallback;
}
