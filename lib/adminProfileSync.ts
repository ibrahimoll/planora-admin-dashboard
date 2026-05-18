export type AdminUser = {
  user_id?: number;
  username?: string;
  email?: string;
  full_name?: string;
  role?: string;
  profile_pic?: string | null;
  created_at?: string;
  is_active?: boolean;
  is_email_verified?: boolean;
};

export const ADMIN_PROFILE_STORAGE_KEY = "current_admin";
export const ADMIN_PROFILE_UPDATED_EVENT = "planora-admin-profile-updated";

export function saveAdminProfile(adminUser: AdminUser) {
  if (typeof window === "undefined") return;

  localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(adminUser));

  window.dispatchEvent(
    new CustomEvent<AdminUser>(ADMIN_PROFILE_UPDATED_EVENT, {
      detail: adminUser,
    }),
  );
}

export function getSavedAdminProfile(): AdminUser | null {
  if (typeof window === "undefined") return null;

  const possibleKeys = [
    ADMIN_PROFILE_STORAGE_KEY,
    "admin_user",
    "current_user",
    "user",
    "planora_user",
  ];

  for (const key of possibleKeys) {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) continue;

    try {
      return JSON.parse(rawValue) as AdminUser;
    } catch {
      continue;
    }
  }

  return null;
}