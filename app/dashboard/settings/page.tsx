"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Reveal } from "@/components/ui/Reveal";
import { api } from "@/lib/api";
import { saveAdminProfile } from "@/lib/adminProfileSync";
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://192.168.0.110:8000";

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

type ApiError = {
  response?: {
    data?: {
      detail?: string;
    };
  };
};

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

  const [profileImageVersion, setProfileImageVersion] = useState(Date.now());

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

  function applyProfileUpdate(updatedProfile: AdminProfile) {
    setProfile(updatedProfile);
    setUsername(updatedProfile.username);
    setFullName(updatedProfile.full_name);
    setProfileImageVersion(Date.now());

    saveAdminProfile(updatedProfile);
  }

  async function loadProfile() {
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
  }

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
      setPasswordError("New password must contain at least one uppercase letter.");
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

  useEffect(() => {
    loadProfile();
  }, []);

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
                  <img
                    src={profileImageSrc}
                    alt="Admin profile"
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
        </div>
      </div>
    </PageTransition>
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
}
