export function saveAdminToken(token: string) {
  localStorage.setItem("planora_admin_token", token);
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("planora_admin_token");
}

export function clearAdminToken() {
  localStorage.removeItem("planora_admin_token");
}

export function isAdminLoggedIn() {
  return Boolean(getAdminToken());
}