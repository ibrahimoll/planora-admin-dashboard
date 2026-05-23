import { api } from "@/lib/api";
import { registerBrowserFcmToken } from "@/lib/firebaseClient";

const BROWSER_DEVICE_KEY = "planora_browser_device_key";

function getBrowserDeviceKey() {
  let deviceKey = localStorage.getItem(BROWSER_DEVICE_KEY);

  if (!deviceKey) {
    deviceKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(BROWSER_DEVICE_KEY, deviceKey);
  }

  return deviceKey;
}

export async function registerCurrentBrowserForPush() {
  try {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) return;

    if (Notification.permission === "denied") return;

    const token = await registerBrowserFcmToken();
    const deviceKey = getBrowserDeviceKey();

    await api.post("/push-notifications/device-tokens", {
      token,
      platform: "web",
      device_key: deviceKey,
    });
  } catch (error) {
    console.warn("Push registration skipped:", error);
  }
}