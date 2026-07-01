interface UserAvatarProps {
  initial: string;
  name?: string;
  size?: "sm" | "md";
  showName?: boolean;
  showOnlineDot?: boolean;
}

export function UserAvatar({
  initial,
  name,
  size = "sm",
  showName = true,
  showOnlineDot = true,
}: UserAvatarProps) {
  const isMd = size === "md";

  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div
          className={`${
            isMd ? "w-10 h-10 text-[14px]" : "w-9 h-9 text-xs"
          } rounded-full bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#a855f7] flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 animate-gradient`}
        >
          {initial}
        </div>
        {showOnlineDot && (
          <span
            className={`absolute ${
              isMd ? "-bottom-0.5 -right-0.5 w-3.5 h-3.5 border-[2.5px]" : "-bottom-0.5 -right-0.5 w-2.5 h-2.5 border-2"
            } bg-[#22c55e] border-white rounded-full ${isMd ? "animate-pulse-glow" : ""}`}
          />
        )}
      </div>

      {showName && name && (
        <div className="hidden lg:block flex-1 min-w-0">
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
