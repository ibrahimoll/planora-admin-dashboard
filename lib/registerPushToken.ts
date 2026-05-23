import { api } from "@/lib/api";
import { registerBrowserFcmToken } from "@/lib/firebaseClient";

export async function registerCurrentBrowserForPush() {
  try {
    if (typeof window === "undefined") return;

    if (!("Notification" in window)) return;

    if (Notification.permission === "denied") return;

    const token = await registerBrowserFcmToken();

    await api.post("/push-notifications/device-tokens", {
      token,
      platform: "web",
    });
  } catch (error) {
    console.warn("Push registration skipped:", error);
  }
}