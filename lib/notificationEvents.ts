export const ADMIN_NOTIFICATIONS_UPDATED_EVENT =
  "planora-admin-notifications-updated";

export function dispatchAdminNotificationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_NOTIFICATIONS_UPDATED_EVENT));
}
