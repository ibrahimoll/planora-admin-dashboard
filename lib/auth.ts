const ADMIN_TOKEN_KEY = "planora_admin_token";

export function saveAdminToken(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function hasAdminToken() {
  return Boolean(getAdminToken());
}

export function isAdminLoggedIn() {
  return hasAdminToken();
}
