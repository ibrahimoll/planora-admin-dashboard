import { api } from "@/lib/api";
import { saveAdminDeviceTokenId } from "@/lib/auth";
import {
  getBrowserDeviceKey,
  registerBrowserFcmToken,
} from "@/lib/firebaseClient";

export async function registerCurrentBrowserForPush() {
  try {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) return;

    if (Notification.permission === "denied") return;

    const token = await registerBrowserFcmToken();
    const deviceKey = getBrowserDeviceKey();

    const response = await api.post<{ device_token_id: number }>(
      "/push-notifications/device-tokens",
      {
        token,
        platform: "web",
        device_key: deviceKey,
      },
    );

    saveAdminDeviceTokenId(response.data.device_token_id);
  } catch (error) {
    console.warn("Push registration skipped:", error);
  }
}
