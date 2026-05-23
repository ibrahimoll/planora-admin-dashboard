importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyBdr6C8WSs4kOniyTog-NkostDDK0nNI1k",
  authDomain: "planora-7a684.firebaseapp.com",
  projectId: "planora-7a684",
  storageBucket: "planora-7a684.firebasestorage.app",
  messagingSenderId: "179943761921",
  appId: "1:179943761921:web:7461be36a0dbec1a697800",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.data?.title || "Planora";

  const options = {
    body: payload.data?.message || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow("/dashboard/notifications"));
});
