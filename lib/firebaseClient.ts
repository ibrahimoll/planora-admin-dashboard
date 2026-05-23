import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function registerBrowserFcmToken() {
  if (typeof window === "undefined") {
    throw new Error("FCM can only run in the browser.");
  }

  const supported = await isSupported().catch(() => false);

  if (!supported || !("serviceWorker" in navigator)) {
    throw new Error("This browser does not support push notifications.");
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  if (!vapidKey) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_VAPID_KEY.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const registration = await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js",
  );

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Firebase did not return a browser token.");
  }

  return token;
}

export function getBrowserDeviceKey() {
  if (typeof window === "undefined") {
    throw new Error("Device key can only run in the browser.");
  }

  const storageKey = "planora_admin_browser_device_key";
  const existing = localStorage.getItem(storageKey);

  if (existing) return existing;

  const created = crypto.randomUUID();
  localStorage.setItem(storageKey, created);

  return created;
}