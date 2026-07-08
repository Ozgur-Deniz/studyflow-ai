"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Palette, Lock, Trash2, User } from "lucide-react";
import { toast } from "react-toastify";
import {
  AVATAR_OPTIONS,
  MALE_AVATARS,
  USER_AVATAR_CHANGE_EVENT,
  USER_AVATAR_STORAGE_KEY,
  createAvatarSvg,
  getAvatarOption,
  type AvatarId,
  type AvatarOption,
} from "@/lib/avatar";

function AvatarPreview({
  avatar,
  className,
}: {
  avatar: AvatarOption;
  className?: string;
}) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: createAvatarSvg(avatar.id) }}
    />
  );
}

interface SessionResponse {
  message?: string;
  user?: {
    id?: unknown;
    name?: unknown;
    email?: unknown;
    avatarId?: unknown;
  };
}

type ProfileResponse = SessionResponse;
type SecurityResponse = Pick<SessionResponse, "message">;
type DeleteAccountResponse = Pick<SessionResponse, "message">;

function splitUserName(name: string) {
  const nameParts = name.trim().split(/\s+/).filter(Boolean);
  const [firstName = "", ...lastNameParts] = nameParts;

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
}

export function AccountSettings() {
  const router = useRouter();
  const [initialAvatar, setInitialAvatar] = useState<AvatarId>(
    MALE_AVATARS[0].id,
  );
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarId>(
    MALE_AVATARS[0].id,
  );
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const hasAvatarChanged = initialAvatar !== selectedAvatar;
  const selectedAvatarOption = getAvatarOption(selectedAvatar);

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      const savedAvatar = window.localStorage.getItem(USER_AVATAR_STORAGE_KEY);
      const avatarId = getAvatarOption(savedAvatar).id;

      setInitialAvatar(avatarId);
      setSelectedAvatar(avatarId);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUserProfile() {
      try {
        setIsLoading(true);

        const response = await fetch("/api/settings/profile", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Profile information could not be loaded.");
        }

        const data = (await response.json()) as SessionResponse;
        const fullName =
          typeof data.user?.name === "string" ? data.user.name : "";
        const userEmail =
          typeof data.user?.email === "string" ? data.user.email : "";
        const avatarId = getAvatarOption(
          typeof data.user?.avatarId === "string"
            ? data.user.avatarId
            : window.localStorage.getItem(USER_AVATAR_STORAGE_KEY),
        ).id;
        const nameParts = splitUserName(fullName);

        if (!isMounted) {
          return;
        }

        setFirstName(nameParts.firstName);
        setLastName(nameParts.lastName);
        setEmail(userEmail);
        setInitialAvatar(avatarId);
        setSelectedAvatar(avatarId);
        window.localStorage.setItem(USER_AVATAR_STORAGE_KEY, avatarId);
        window.dispatchEvent(
          new CustomEvent(USER_AVATAR_CHANGE_EVENT, {
            detail: { avatarId },
          }),
        );
      } catch (error) {
        if (isMounted) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Profile information could not be loaded.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          avatarId: selectedAvatar,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as ProfileResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Profile could not be updated.");
      }

      setInitialAvatar(selectedAvatar);
      setIsPickerOpen(false);
      window.localStorage.setItem(USER_AVATAR_STORAGE_KEY, selectedAvatar);
      window.dispatchEvent(
        new CustomEvent(USER_AVATAR_CHANGE_EVENT, {
          detail: { avatarId: selectedAvatar },
        }),
      );
      toast.success(data.message ?? "Profile updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Profile could not be updated.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const hasConfirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
    );

    if (!hasConfirmed) {
      return;
    }

    try {
      setIsDeletingAccount(true);

      const response = await fetch("/api/settings/account", {
        method: "DELETE",
      });
      const data = (await response
        .json()
        .catch(() => ({}))) as DeleteAccountResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Account could not be deleted.");
      }

      window.localStorage.removeItem(USER_AVATAR_STORAGE_KEY);
      window.dispatchEvent(
        new CustomEvent(USER_AVATAR_CHANGE_EVENT, {
          detail: {},
        }),
      );
      toast.success(data.message ?? "Account deleted successfully.");
      router.replace("/login");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Account could not be deleted.",
      );
      setIsDeletingAccount(false);
    }
  };

  const handleUpdatePassword = async () => {
    try {
      setIsUpdatingPassword(true);

      const response = await fetch("/api/settings/security", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await response
        .json()
        .catch(() => ({}))) as SecurityResponse;

      if (!response.ok) {
        throw new Error(data.message ?? "Password could not be updated.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(data.message ?? "Password updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Password could not be updated.",
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-[#0f172a]">
            Personal Information
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#64748b]">
            Update your profile details and contact information.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 shadow-md shadow-indigo-200 ring-1 ring-[#e2e8f0] transition-all duration-300">
            <AvatarPreview
              avatar={selectedAvatarOption}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setIsPickerOpen((currentState) => !currentState)
                }
                className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-4 text-sm font-medium text-[#334155] shadow-sm transition hover:border-[#c7d2fe] hover:bg-[#f8fafc] hover:text-[#6366f1] focus:outline-none focus:ring-4 focus:ring-[#6366f1]/10"
              >
                <Palette className="h-4 w-4" />
                Change Avatar
              </button>
              <p className="text-xs leading-5 text-[#94a3b8]">
                Choose an avatar style for your profile.
              </p>
            </div>

            {isPickerOpen && (
              <div className="mt-4 grid w-full max-w-2xl grid-cols-4 gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-3 shadow-sm sm:grid-cols-8">
                {AVATAR_OPTIONS.map((avatarOption) => {
                  const isSelected = selectedAvatar === avatarOption.id;

                  return (
                    <button
                      key={avatarOption.id}
                      type="button"
                      onClick={() => setSelectedAvatar(avatarOption.id)}
                      className={`flex h-14 w-14 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-slate-100 shadow-sm transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#6366f1]/10 ${
                        isSelected
                          ? "ring-4 ring-indigo-500 ring-offset-2 ring-offset-white"
                          : "ring-1 ring-white/70"
                      }`}
                      aria-label={`Select ${avatarOption.id} avatar`}
                    >
                      <AvatarPreview
                        avatar={avatarOption}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="first-name"
              className="block text-sm font-medium text-[#0f172a]"
            >
              First name
            </label>
            <input
              id="first-name"
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm font-medium text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:bg-white focus:ring-4 focus:ring-[#6366f1]/10"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="last-name"
              className="block text-sm font-medium text-[#0f172a]"
            >
              Last name
            </label>
            <input
              id="last-name"
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm font-medium text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:bg-white focus:ring-4 focus:ring-[#6366f1]/10"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#0f172a]"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm font-medium text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:bg-white focus:ring-4 focus:ring-[#6366f1]/10"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={isLoading || isSaving}
            className={`inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold shadow-sm transition-colors duration-300 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#6366f1]/10 ${
              hasAvatarChanged
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "bg-[#0f172a] text-white hover:bg-[#1e293b]"
            }`}
          >
            <User className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-[#0f172a]">
            Security
          </h2>
          <p className="mt-1 text-sm leading-6 text-[#64748b]">
            Change your password to keep your account secure.
          </p>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <label
              htmlFor="current-password"
              className="block text-sm font-medium text-[#0f172a]"
            >
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              disabled={isUpdatingPassword}
              className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm font-medium text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:bg-white focus:ring-4 focus:ring-[#6366f1]/10"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-[#0f172a]"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={isUpdatingPassword}
                className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm font-medium text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:bg-white focus:ring-4 focus:ring-[#6366f1]/10"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-[#0f172a]"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isUpdatingPassword}
                className="h-11 w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 text-sm font-medium text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#6366f1] focus:bg-white focus:ring-4 focus:ring-[#6366f1]/10"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleUpdatePassword}
            disabled={isUpdatingPassword}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-5 text-sm font-semibold text-[#334155] shadow-sm transition hover:border-[#c7d2fe] hover:bg-[#f8fafc] hover:text-[#6366f1] focus:outline-none focus:ring-4 focus:ring-[#6366f1]/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Lock className="h-4 w-4" />
            {isUpdatingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-red-50/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-red-900">
              Danger Zone
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-red-700">
              Permanently delete your account and all related study data. This
              action cannot be undone.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" />
            {isDeletingAccount ? "Deleting..." : "Delete Account"}
          </button>
        </div>
      </section>
    </div>
  );
}
