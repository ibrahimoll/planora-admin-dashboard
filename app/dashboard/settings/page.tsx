"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { saveAdminProfile } from "@/lib/adminProfileSync";
import { API_BASE_URL, api } from "@/lib/api";
import { registerBrowserFcmToken } from "@/lib/firebaseClient";
import { clearAdminToken } from "@/lib/auth";
import type {
  AdminDeviceToken,
  AdminNotificationPreference,
  AdminNotificationPreferenceKey,
  AdminPushTestResponse,
  FirebasePushStatus,
} from "@/types/admin";
import {
  BellRing,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  Power,
  RefreshCw,
  Save,
  Send,
  Server,
  ShieldCheck,
  Smartphone,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AdminProfile = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  profile_pic: string | null;
  created_at: string;
};

type ProfileUpdateResponse = {
  message: string;
  user: AdminProfile;
};

type ChangePasswordResponse = {
  message: string;
};

type DeleteAccountResponse = {
  message: string;
};

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

const notificationPreferenceFields: Array<{
  key: AdminNotificationPreferenceKey;
  label: string;
  detail: string;
}> = [
  {
    key: "push_enabled",
    label: "Push enabled",
    detail: "Master switch for push delivery.",
  },
  {
    key: "deadline_notifications",
    label: "Deadline notifications",
    detail: "Deadline and reminder alerts.",
  },
  {
    key: "risk_notifications",
    label: "Risk notifications",
    detail: "High-risk project alerts.",
  },
  {
    key: "task_notifications",
    label: "Task notifications",
    detail: "Task changes and assignments.",
  },
  {
    key: "project_notifications",
    label: "Project notifications",
    detail: "Project updates.",
  },
  {
    key: "team_notifications",
    label: "Team notifications",
    detail: "Team membership and updates.",
  },
  {
    key: "comment_notifications",
    label: "Comment notifications",
    detail: "Task and project comments.",
  },
  {
    key: "mention_notifications",
    label: "Mention notifications",
    detail: "Direct mentions.",
  },
  {
    key: "invite_notifications",
    label: "Invite notifications",
    detail: "Team and project invites.",
  },
  {
    key: "ai_notifications",
    label: "AI notifications",
    detail: "AI planning and assistant updates.",
  },
  {
    key: "system_notifications",
    label: "System notifications",
    detail: "Planora system notices.",
  },
  {
    key: "email_enabled",
    label: "Email enabled",
    detail: "Stored preference for email delivery.",
  },
];

function getApiErrorMessage(error: unknown, fallback: string) {
  const detail = (error as ApiError).response?.data?.detail;
  return typeof detail === "string" ? detail : fallback;
}

function getInitials(name: string, username: string) {
  const source = name.trim() || username.trim() || "Admin";
  const parts = source.split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "A";
}

function formatDate(value: string) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function maskToken(value: string) {
  if (!value) return "Token unavailable";

  if (value.length <= 16) {
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }

  return `${value.slice(0, 8)}...${value.slice(-8)}`;
}

function getProfileImageSrc(
  profilePic: string | null | undefined,
  version: number,
) {
  if (!profilePic) return "";

  if (profilePic.startsWith("data:")) {
    return profilePic;
  }

  let imageUrl = profilePic;

  if (!profilePic.startsWith("http://") && !profilePic.startsWith("https://")) {
    imageUrl = profilePic.startsWith("/")
      ? `${API_BASE_URL}${profilePic}`
      : `${API_BASE_URL}/${profilePic}`;
  }

  const separator = imageUrl.includes("?") ? "&" : "?";
  return `${imageUrl}${separator}v=${version}`;
}

export default function AdminSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<AdminProfile | null>(null);

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [removingPicture, setRemovingPicture] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileImageVersion, setProfileImageVersion] = useState(() =>
    Date.now(),
  );

  const initials = useMemo(() => {
    return getInitials(fullName, username);
  }, [fullName, username]);

  const profileImageSrc = getProfileImageSrc(
    profile?.profile_pic,
    profileImageVersion,
  );

  const hasProfileChanges = useMemo(() => {
    if (!profile) return false;

    return (
      username.trim() !== profile.username ||
      fullName.trim() !== profile.full_name
    );
  }, [profile, username, fullName]);

  const applyProfileUpdate = useCallback((updatedProfile: AdminProfile) => {
    setProfile(updatedProfile);
    setUsername(updatedProfile.username);
    setFullName(updatedProfile.full_name);
    setProfileImageVersion(Date.now());

    saveAdminProfile(updatedProfile);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setProfileError("");
    setProfileNotice("");

    try {
      const response = await api.get<AdminProfile>("/profile");
      applyProfileUpdate(response.data);
    } catch (requestError) {
      setProfileError(
        getApiErrorMessage(requestError, "Unable to load profile settings."),
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [applyProfileUpdate]);

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setProfileError("");
    setProfileNotice("");

    const cleanUsername = username.trim();
    const cleanFullName = fullName.trim();

    if (cleanUsername.length < 3) {
      setProfileError("Username must be at least 3 characters.");
      return;
    }

    if (!cleanFullName) {
      setProfileError("Full name is required.");
      return;
    }

    setSavingProfile(true);

    try {
      const response = await api.patch<ProfileUpdateResponse>("/profile", {
        username: cleanUsername,
        full_name: cleanFullName,
      });

      applyProfileUpdate(response.data.user);
      setProfileNotice(response.data.message);
    } catch (requestError) {
      setProfileError(
        getApiErrorMessage(requestError, "Unable to update profile."),
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleProfilePictureChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    setProfileError("");
    setProfileNotice("");

    if (!file.type.startsWith("image/")) {
      setProfileError("Please select an image file.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setProfileError("Profile picture must be 3MB or less.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingPicture(true);

    try {
      const response = await api.post<ProfileUpdateResponse>(
        "/profile/picture",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      applyProfileUpdate(response.data.user);
      setProfileNotice(response.data.message);
    } catch (requestError) {
      setProfileError(
        getApiErrorMessage(requestError, "Unable to upload profile picture."),
      );
    } finally {
      setUploadingPicture(false);
    }
  }

  async function handleRemoveProfilePicture() {
    setProfileError("");
    setProfileNotice("");
    setRemovingPicture(true);

    try {
      const response = await api.patch<ProfileUpdateResponse>("/profile", {
        profile_pic: "",
      });

      applyProfileUpdate(response.data.user);
      setProfileNotice("Profile picture removed successfully.");
    } catch (requestError) {
      setProfileError(
        getApiErrorMessage(requestError, "Unable to remove profile picture."),
      );
    } finally {
      setRemovingPicture(false);
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPasswordError("");
    setPasswordNotice("");

    if (!oldPassword.trim()) {
      setPasswordError("Current password is required.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError(
        "New password must contain at least one uppercase letter.",
      );
      return;
    }

    if (!/[^\w\s]/.test(newPassword)) {
      setPasswordError("New password must contain at least one symbol.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      const response = await api.patch<ChangePasswordResponse>(
        "/profile/password",
        {
          old_password: oldPassword,
          new_password: newPassword,
        },
      );

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice(response.data.message);
    } catch (requestError) {
      setPasswordError(
        getApiErrorMessage(requestError, "Unable to change password."),
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setDeleteError("");

    if (!deletePassword.trim()) {
      setDeleteError("Current password is required.");
      return;
    }

    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      setDeleteError('Type "DELETE MY ACCOUNT" exactly to confirm.');
      return;
    }

    setDeletingAccount(true);

    try {
      await api.delete<DeleteAccountResponse>("/profile", {
        data: {
          current_password: deletePassword,
          confirmation_text: deleteConfirmation,
        },
      });

      clearAdminToken();
      window.location.assign("/login");
    } catch (requestError) {
      setDeleteError(
        getApiErrorMessage(requestError, "Unable to delete this account."),
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProfile();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadProfile]);

  if (loadingProfile) {
    return (
      <PageTransition className="space-y-6 pb-10">
        <GlassCard>
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 size={18} className="animate-spin text-teal-300" />
            Loading profile settings...
          </div>
        </GlassCard>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-6 pb-10">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={loadProfile}
          disabled={loadingProfile}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-teal-500/30 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingProfile ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <RefreshCw size={17} />
          )}
          Refresh
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <Reveal delay={0.04}>
          <GlassCard className="h-full">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                {profileImageSrc ? (
                  <Image
                    src={profileImageSrc}
                    alt="Admin profile"
                    width={112}
                    height={112}
                    unoptimized
                    className="h-28 w-28 rounded-3xl border border-teal-500/20 object-cover shadow-lg shadow-black/25"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-3xl border border-teal-500/20 bg-teal-500/10 text-3xl font-bold text-teal-100 shadow-lg shadow-black/25">
                    {initials}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-teal-200 transition hover:border-teal-500/40 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Upload profile picture"
                >
                  {uploadingPicture ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} />
                  )}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProfilePictureChange}
                className="hidden"
              />

              <h2 className="mt-6 text-2xl font-bold text-white">
                {fullName || "Admin"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">@{username}</p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPicture}
                  className="inline-flex items-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 px-3 py-2 text-sm font-semibold text-teal-100 transition hover:border-teal-400/40 hover:bg-teal-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingPicture ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ImagePlus size={16} />
                  )}
                  Choose image
                </button>

                {profile?.profile_pic && (
                  <button
                    type="button"
                    onClick={handleRemoveProfilePicture}
                    disabled={removingPicture}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {removingPicture ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Remove
                  </button>
                )}
              </div>

              <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Upload size={14} />
                PNG, JPG, JPEG, or WEBP. Max 3MB.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">
                  {profile?.role ?? "admin"}
                </span>

                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  {profile?.is_active ? "Active" : "Inactive"}
                </span>

                <span className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-300">
                  {profile?.is_email_verified ? "Verified" : "Unverified"}
                </span>
              </div>

              <div className="mt-6 w-full rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Account email
                </p>
                <p className="mt-2 break-words text-sm font-semibold text-white">
                  {profile?.email}
                </p>
              </div>

              <div className="mt-3 w-full rounded-2xl border border-slate-800 bg-slate-950/35 p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Created
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  {profile?.created_at
                    ? formatDate(profile.created_at)
                    : "Not available"}
                </p>
              </div>
            </div>
          </GlassCard>
        </Reveal>

        <div className="space-y-6">
          <Reveal delay={0.08}>
            <GlassCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                    Profile
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Edit profile information
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Change your display name and username.
                  </p>
                </div>

                <ShieldCheck className="shrink-0 text-teal-300" size={22} />
              </div>

              {profileError && (
                <div className="mt-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {profileError}
                </div>
              )}

              {profileNotice && (
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  <CheckCircle2 size={17} />
                  {profileNotice}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="settings-full-name"
                      className="text-sm font-medium text-slate-300"
                    >
                      Full name
                    </label>
                    <input
                      id="settings-full-name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-teal-500"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="settings-username"
                      className="text-sm font-medium text-slate-300"
                    >
                      Username
                    </label>
                    <input
                      id="settings-username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-teal-500"
                      placeholder="admin_username"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingProfile || !hasProfileChanges}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-500 bg-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Save size={17} />
                  )}
                  Save profile
                </button>
              </form>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.12}>
            <GlassCard glow="amber">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                    Security
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Change password
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    New password must be at least 8 characters and include one
                    uppercase letter and one symbol.
                  </p>
                </div>

                <KeyRound className="shrink-0 text-amber-300" size={22} />
              </div>

              {passwordError && (
                <div className="mt-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {passwordError}
                </div>
              )}

              {passwordNotice && (
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  <CheckCircle2 size={17} />
                  {passwordNotice}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="mt-6 space-y-5">
                <PasswordField
                  id="settings-old-password"
                  label="Current password"
                  value={oldPassword}
                  onChange={setOldPassword}
                  show={showOldPassword}
                  onToggleShow={() => setShowOldPassword((value) => !value)}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <PasswordField
                    id="settings-new-password"
                    label="New password"
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showNewPassword}
                    onToggleShow={() => setShowNewPassword((value) => !value)}
                  />

                  <PasswordField
                    id="settings-confirm-password"
                    label="Confirm new password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showConfirmPassword}
                    onToggleShow={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500 bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <KeyRound size={17} />
                  )}
                  Change password
                </button>
              </form>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.14}>
            <GlassCard className="border-rose-500/20 bg-rose-500/5" glow="rose">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-300">
                    Danger zone
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-white">
                    Delete account
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    This deactivates your admin account and signs you out
                    immediately. You will not be able to access protected admin
                    routes after deletion.
                  </p>
                </div>

                <Trash2 className="shrink-0 text-rose-300" size={22} />
              </div>

              {deleteError && (
                <div className="mt-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {deleteError}
                </div>
              )}

              <form onSubmit={handleDeleteAccount} className="mt-6 space-y-5">
                <PasswordField
                  id="settings-delete-password"
                  label="Current password"
                  value={deletePassword}
                  onChange={setDeletePassword}
                  show={showDeletePassword}
                  onToggleShow={() => setShowDeletePassword((value) => !value)}
                />

                <div>
                  <label
                    htmlFor="settings-delete-confirmation"
                    className="text-sm font-medium text-slate-300"
                  >
                    Type DELETE MY ACCOUNT
                  </label>
                  <input
                    id="settings-delete-confirmation"
                    value={deleteConfirmation}
                    onChange={(event) =>
                      setDeleteConfirmation(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-rose-500"
                    placeholder="DELETE MY ACCOUNT"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    deletingAccount ||
                    !deletePassword.trim() ||
                    deleteConfirmation !== "DELETE MY ACCOUNT"
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500 bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingAccount ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Trash2 size={17} />
                  )}
                  Delete my account
                </button>
              </form>
            </GlassCard>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.16}>
        <PushNotificationSection />
      </Reveal>
    </PageTransition>
  );
}

function PushNotificationSection() {
  const [status, setStatus] = useState<FirebasePushStatus | null>(null);
  const [preferences, setPreferences] =
    useState<AdminNotificationPreference | null>(null);
  const [deviceTokens, setDeviceTokens] = useState<AdminDeviceToken[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [savingPreference, setSavingPreference] =
    useState<AdminNotificationPreferenceKey | null>(null);
  const [deactivatingTokenId, setDeactivatingTokenId] = useState<number | null>(
    null,
  );
  const [testTitle, setTestTitle] = useState("Planora test push");
  const [testMessage, setTestMessage] = useState(
    "This is a test push from the admin dashboard.",
  );
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isRegisteringBrowser, setIsRegisteringBrowser] = useState(false);
  const [testResult, setTestResult] = useState<AdminPushTestResponse | null>(
    null,
  );

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const activeTokenCount = useMemo(() => {
    return deviceTokens.filter((token) => token.is_active).length;
  }, [deviceTokens]);

  const loadPushSettings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    setNotice("");

    try {
      const [statusResponse, preferenceResponse, tokensResponse] =
        await Promise.all([
          api.get<FirebasePushStatus>("/push-notifications/status"),
          api.get<AdminNotificationPreference>(
            "/push-notifications/preferences",
          ),
          api.get<AdminDeviceToken[]>("/push-notifications/device-tokens"),
        ]);

      setStatus(statusResponse.data);
      setPreferences(preferenceResponse.data);
      setDeviceTokens(tokensResponse.data);
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to load push notification settings.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadPushSettings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPushSettings]);

  async function handlePreferenceToggle(
    key: AdminNotificationPreferenceKey,
    nextValue: boolean,
  ) {
    if (!preferences) return;

    const previousPreferences = preferences;

    setSavingPreference(key);
    setError("");
    setNotice("");
    setPreferences({
      ...preferences,
      [key]: nextValue,
    });

    try {
      const response = await api.patch<AdminNotificationPreference>(
        "/push-notifications/preferences",
        {
          [key]: nextValue,
        },
      );

      setPreferences(response.data);
      setNotice("Notification preferences saved.");
      window.setTimeout(() => setNotice(""), 2400);
    } catch (requestError) {
      setPreferences(previousPreferences);
      setError(
        getApiErrorMessage(
          requestError,
          "Unable to update notification preferences.",
        ),
      );
    } finally {
      setSavingPreference(null);
    }
  }

  async function handleDeactivateToken(deviceTokenId: number) {
    setDeactivatingTokenId(deviceTokenId);
    setError("");
    setNotice("");

    try {
      const response = await api.patch<AdminDeviceToken>(
        `/push-notifications/device-tokens/${deviceTokenId}/deactivate`,
      );

      setDeviceTokens((current) =>
        current.map((token) =>
          token.device_token_id === deviceTokenId ? response.data : token,
        ),
      );
      setNotice("Device token deactivated.");
      window.setTimeout(() => setNotice(""), 2400);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, "Unable to deactivate device token."),
      );
    } finally {
      setDeactivatingTokenId(null);
    }
  }

  async function handleRegisterBrowserToken() {
    setError("");
    setNotice("");
    setTestResult(null);
    setIsRegisteringBrowser(true);

    try {
      const token = await registerBrowserFcmToken();

      await api.post("/push-notifications/device-tokens", {
        token,
        platform: "web",
      });

      setNotice("This browser was registered for push notifications.");
      await loadPushSettings();

      window.setTimeout(() => setNotice(""), 3000);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to register this browser for push notifications.",
      );
    } finally {
      setIsRegisteringBrowser(false);
    }
  }

  async function handleSendTestPush(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTitle = testTitle.trim();
    const cleanMessage = testMessage.trim();

    setError("");
    setNotice("");
    setTestResult(null);

    if (!cleanTitle || !cleanMessage) {
      setError("Test push title and message are required.");
      return;
    }

    setIsSendingTest(true);

    try {
      const response = await api.post<AdminPushTestResponse>(
        "/push-notifications/test",
        {
          title: cleanTitle,
          message: cleanMessage,
        },
      );

      setTestResult(response.data);
      setNotice(response.data.detail);
      window.setTimeout(() => setNotice(""), 2400);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to send test push."));
    } finally {
      setIsSendingTest(false);
    }
  }

  return (
    <GlassCard glow="cyan">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
            Push notifications
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Firebase status and delivery preferences
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Manage push delivery settings and saved device tokens for this admin
            account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPushSettings()}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-teal-500/30 hover:text-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <RefreshCw size={17} />
          )}
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {notice && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 size={17} />
          {notice}
        </div>
      )}

      {isLoading ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 px-5 py-8 text-slate-300">
          <Loader2 size={20} className="animate-spin text-teal-300" />
          Loading push notification settings...
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Firebase sending
                  </p>
                  <p
                    className={`mt-2 text-xl font-bold ${
                      status?.firebase_enabled
                        ? "text-emerald-200"
                        : "text-amber-200"
                    }`}
                  >
                    {status?.firebase_enabled ? "Enabled" : "Disabled"}
                  </p>
                </div>
                <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-3 text-teal-200">
                  <Power size={20} />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {status?.message || "Firebase status unavailable."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Firebase credentials
                  </p>
                  <p
                    className={`mt-2 text-xl font-bold ${
                      status?.firebase_configured
                        ? "text-emerald-200"
                        : "text-amber-200"
                    }`}
                  >
                    {status?.firebase_configured ? "Configured" : "Missing"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-slate-200">
                  <Server size={20} />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Private Firebase configuration is not exposed in this dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Active tokens
                  </p>
                  <p className="mt-2 text-xl font-bold text-white">
                    {activeTokenCount} / {deviceTokens.length}
                  </p>
                </div>
                <div className="rounded-xl border border-teal-500/20 bg-teal-500/10 p-3 text-teal-200">
                  <Smartphone size={20} />
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Saved device tokens tied to this admin user.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-teal-500/20 bg-teal-500/10 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Smartphone size={18} className="text-teal-300" />
                  <h3 className="text-lg font-semibold text-white">
                    Register this browser
                  </h3>
                </div>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Allow notifications and save this browser&apos;s Firebase
                  token so Planora can send real browser push notifications to
                  this admin account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void handleRegisterBrowserToken()}
                disabled={isRegisteringBrowser}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRegisteringBrowser ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Smartphone size={17} />
                )}
                Register browser
              </button>
            </div>
          </div>
          <form
            onSubmit={handleSendTestPush}
            className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5"
          >
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Send size={18} className="text-teal-300" />
                  <h3 className="text-lg font-semibold text-white">
                    Send test push
                  </h3>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  Sends a backend test push to this admin account using saved
                  active device tokens and current preferences.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSendingTest}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSendingTest ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Send size={17} />
                )}
                Send test
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-medium text-slate-300">
                  Test title
                </span>
                <input
                  value={testTitle}
                  onChange={(event) => setTestTitle(event.target.value)}
                  maxLength={150}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
                  placeholder="Planora test push"
                />
              </label>

              <label>
                <span className="text-sm font-medium text-slate-300">
                  Test message
                </span>
                <input
                  value={testMessage}
                  onChange={(event) => setTestMessage(event.target.value)}
                  maxLength={500}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-500/60"
                  placeholder="This is a test push from the admin dashboard."
                />
              </label>
            </div>

            {testResult && (
              <div className="mt-5 rounded-2xl border border-teal-500/20 bg-teal-500/10 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-teal-100">
                    {testResult.status}
                  </span>
                  <span className="text-sm text-slate-300">
                    {testResult.detail}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {[
                    ["Sent", testResult.sent_count],
                    ["Skipped", testResult.skipped_count],
                    ["Failed", testResult.failed_count],
                    ["Deactivated", testResult.deactivated_tokens],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-800 bg-slate-950/45 p-3"
                    >
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>

          <div>
            <div className="flex items-center gap-2">
              <BellRing size={18} className="text-teal-300" />
              <h3 className="text-lg font-semibold text-white">
                Notification preferences
              </h3>
            </div>

            {!preferences ? (
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/45 px-5 py-8 text-sm text-slate-400">
                Notification preferences are not available.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {notificationPreferenceFields.map((field) => {
                  const enabled = preferences[field.key];
                  const saving = savingPreference === field.key;

                  return (
                    <button
                      key={field.key}
                      type="button"
                      aria-pressed={enabled}
                      onClick={() =>
                        void handlePreferenceToggle(field.key, !enabled)
                      }
                      disabled={savingPreference !== null}
                      className={`rounded-2xl border p-4 text-left transition hover:border-teal-500/30 disabled:cursor-not-allowed disabled:opacity-70 ${
                        enabled
                          ? "border-teal-500/20 bg-teal-500/10"
                          : "border-slate-800 bg-slate-950/45"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">
                            {field.label}
                          </p>
                          <p className="mt-1 text-sm leading-5 text-slate-400">
                            {field.detail}
                          </p>
                        </div>

                        <span
                          className={
                            enabled ? "text-teal-200" : "text-slate-500"
                          }
                        >
                          {saving ? (
                            <Loader2 size={22} className="animate-spin" />
                          ) : enabled ? (
                            <ToggleRight size={26} />
                          ) : (
                            <ToggleLeft size={26} />
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-teal-300" />
              <h3 className="text-lg font-semibold text-white">
                Saved device tokens
              </h3>
            </div>

            <div className="mt-4 space-y-3">
              {deviceTokens.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-950/45 px-5 py-8 text-sm text-slate-400">
                  No device tokens are registered for this admin account.
                </div>
              ) : (
                deviceTokens.map((token) => (
                  <div
                    key={token.device_token_id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-semibold capitalize text-teal-200">
                            {token.platform}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              token.is_active
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                : "border-slate-700 bg-slate-900 text-slate-300"
                            }`}
                          >
                            {token.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                            Token #{token.device_token_id}
                          </span>
                        </div>

                        <p className="mt-3 break-all font-mono text-sm text-slate-300">
                          {maskToken(token.token)}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            Created {formatDateTime(token.created_at)}
                          </span>
                          <span>
                            Last used {formatDateTime(token.last_used_at)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          void handleDeactivateToken(token.device_token_id)
                        }
                        disabled={
                          !token.is_active || deactivatingTokenId !== null
                        }
                        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 text-sm font-semibold text-rose-100 transition hover:border-rose-400/40 hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deactivatingTokenId === token.device_token_id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <XCircle size={16} />
                        )}
                        Deactivate
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-slate-300">
        {label}
      </label>

      <div className="relative mt-2">
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={show ? "text" : "password"}
          className="w-full rounded-xl border border-slate-800 bg-slate-950/45 px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-teal-500"
          placeholder="********"
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-teal-500/30 hover:text-teal-200"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );