"use client";

import { useEffect, useState } from "react";
import {
  USER_AVATAR_CHANGE_EVENT,
  USER_AVATAR_STORAGE_KEY,
  createAvatarSvg,
  getAvatarOption,
} from "@/lib/avatar";

interface UserAvatarProps {
  initial: string;
  name?: string;
  avatarId?: string | null;
  size?: "sm" | "md";
  showName?: boolean;
  showOnlineDot?: boolean;
}

export function UserAvatar({
  initial,
  name,
  avatarId,
  size = "sm",
  showName = true,
  showOnlineDot = true,
}: UserAvatarProps) {
  const isMd = size === "md";
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (!avatarId) {
      return;
    }

    const nextAvatarId = getAvatarOption(avatarId).id;
    const animationFrameId = window.requestAnimationFrame(() => {
      setSelectedAvatar(nextAvatarId);
      window.localStorage.setItem(USER_AVATAR_STORAGE_KEY, nextAvatarId);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [avatarId]);

  useEffect(() => {
    const syncAvatar = () => {
      const savedAvatar = window.localStorage.getItem(USER_AVATAR_STORAGE_KEY);
      setSelectedAvatar(savedAvatar ? getAvatarOption(savedAvatar).id : null);
    };

    const handleAvatarChange = (event: Event) => {
      const avatarEvent = event as CustomEvent<{ avatarId?: string }>;
      setSelectedAvatar(
        avatarEvent.detail?.avatarId
          ? getAvatarOption(avatarEvent.detail.avatarId).id
          : null,
      );
    };

    syncAvatar();
    window.addEventListener("storage", syncAvatar);
    window.addEventListener(USER_AVATAR_CHANGE_EVENT, handleAvatarChange);

    return () => {
      window.removeEventListener("storage", syncAvatar);
      window.removeEventListener(USER_AVATAR_CHANGE_EVENT, handleAvatarChange);
    };
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className={`overflow-hidden ${
            isMd ? "w-10 h-10 text-[14px]" : "w-9 h-9 text-xs"
          } rounded-full bg-gradient-to-br from-[#0a9f43] via-[#4ade80] to-[#86efac] flex items-center justify-center text-white font-bold shadow-md shadow-emerald-200 animate-gradient`}
        >
          {selectedAvatar ? (
            <div
              className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
              dangerouslySetInnerHTML={{
                __html: createAvatarSvg(selectedAvatar),
              }}
            />
          ) : (
            initial
          )}
        </div>
        {showOnlineDot && (
          <span
            className={`absolute ${
              isMd ? "-bottom-0.5 -right-0.5 w-3.5 h-3.5 border-[2.5px]" : "-bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2"
            } bg-[#22c55e] border-white rounded-full`}
          />
        )}
      </div>

      {showName && name && (
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-[#0f172a] truncate leading-tight ${isMd ? "text-[13px]" : "text-[13px]"}`}>
            {name}
          </p>
          {showOnlineDot && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
              <p className={`text-[#22c55e] font-semibold ${isMd ? "text-[11px]" : "text-[10px]"}`}>
                Online
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
