"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  LogOut,
  ChevronDown,
  Layers,
  ClipboardList,
  User,
  Timer,
} from "lucide-react";
import { Logo } from "../ui/Logo";
import { UserAvatar } from "../ui/UserAvatar";

interface SidebarProps {
  userName: string;
  userInitial: string;
  userAvatarId?: string | null;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function Sidebar({
  userName,
  userInitial,
  userAvatarId,
  onLogout,
  isLoggingOut,
}: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Study Plans", path: "/study-plans", icon: BookOpen },
    { name: "Focus Zone", path: "/focus-zone", icon: Timer },
    { name: "Flashcards", path: "/flashcards", icon: Layers },
    { name: "Quizzes", path: "/quizzes", icon: ClipboardList },
    { name: "AI Assistant", path: "/ai-assistant", icon: Sparkles },
  ];

  return (
    <aside className="w-[270px] bg-white border-r border-[#e2e8f0] flex flex-col animate-slide-in-left relative overflow-hidden shrink-0">
      {/* Subtle gradient decoration at top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] animate-gradient" />

      {/* Logo */}
      <div className="h-[72px] flex items-center px-6">
        <Logo size="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 pb-2 stagger">
        <p className="px-4 mb-3 text-[10px] font-bold text-[#94a3b8] uppercase tracking-[0.1em]">
          Menu
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold mb-1 transition-all duration-300 relative ${
                isActive
                  ? "bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg shadow-indigo-200/60"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              }`}
            >
              <Icon
                size={20}
                className={`transition-all duration-300 ${
                  isActive
                    ? "text-white"
                    : "text-[#94a3b8] group-hover:text-[#6366f1] group-hover:scale-110"
                }`}
              />
              {item.name}
              {isActive && (
                <span className="absolute right-3 w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-[#e2e8f0] p-3">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            className="group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-[#f1f5f9] focus:outline-none focus:ring-4 focus:ring-[#6366f1]/10"
            aria-expanded={isOpen}
            aria-haspopup="menu"
          >
            <UserAvatar
              initial={userInitial}
              name={userName}
              avatarId={userAvatarId}
              size="md"
              showName={true}
              showOnlineDot={true}
            />
            <ChevronDown
              size={14}
              className={`text-[#94a3b8] transition-transform duration-200 group-hover:text-[#0f172a] ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div
              className="absolute bottom-[calc(100%+0.65rem)] left-0 z-50 w-full overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-lg"
              role="menu"
            >
              <Link
                href="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#334155] transition hover:bg-[#f8fafc] hover:text-[#6366f1]"
                role="menuitem"
              >
                <User className="h-4 w-4" />
                Profile
              </Link>
              <button
                type="button"
                onClick={onLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-[#f43f5e] transition hover:bg-[#fff1f2] disabled:cursor-not-allowed disabled:opacity-60"
                role="menuitem"
              >
                <LogOut className="h-4 w-4" />
                {isLoggingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
