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

  try {
    localStorage.setItem(ADMIN_PROFILE_STORAGE_KEY, JSON.stringify(adminUser));
  } catch {
    // If the image data is too large for localStorage, still update the current tab.
  }

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

export function getAdminDisplayName(adminUser: AdminUser | null) {
  return (
    adminUser?.full_name ||
    adminUser?.username ||
    adminUser?.email?.split("@")[0] ||
    "Planora Admin"
  );
}

export function getAdminInitials(adminUser: AdminUser | null) {
  const source = getAdminDisplayName(adminUser).trim();
  const parts = source.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "A";
}

export function getApiBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://192.168.0.110:8000"
  );
}

export function buildProfileImageUrl(profilePic?: string | null) {
  if (!profilePic) return null;

  if (
    profilePic.startsWith("http://") ||
    profilePic.startsWith("https://") ||
    profilePic.startsWith("data:")
  ) {
    return profilePic;
  }

  return profilePic.startsWith("/")
    ? `${getApiBaseUrl()}${profilePic}`
    : `${getApiBaseUrl()}/${profilePic}`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not read image file."));
      }
    };

    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}
