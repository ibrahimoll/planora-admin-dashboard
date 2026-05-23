const ADMIN_TOKEN_KEY = "planora_admin_token";
const ADMIN_DEVICE_TOKEN_ID_KEY = "planora_admin_device_token_id";

export function saveAdminToken(token: string) {
  if (typeof window === "undefined") return;

  // New secure behavior: token dies when browser/tab session ends.
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);

  // Clean old persisted tokens from previous localStorage version.
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getAdminToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function clearAdminToken() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function saveAdminDeviceTokenId(deviceTokenId: number | string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_DEVICE_TOKEN_ID_KEY, String(deviceTokenId));
}

export function getAdminDeviceTokenId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_DEVICE_TOKEN_ID_KEY);
}

export function clearAdminDeviceTokenId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_DEVICE_TOKEN_ID_KEY);
}

export function hasAdminToken() {
  return Boolean(getAdminToken());
}

export function isAdminLoggedIn() {
  return hasAdminToken();
}