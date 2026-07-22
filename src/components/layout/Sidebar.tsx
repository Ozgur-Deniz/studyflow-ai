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
  X,
} from "lucide-react";
import { Logo } from "../ui/Logo";
import { UserAvatar } from "../ui/UserAvatar";

interface SidebarProps {
  userName: string;
  userInitial: string;
  userAvatarId?: string | null;
  onLogout: () => void;
  isLoggingOut: boolean;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  userName,
  userInitial,
  userAvatarId,
  onLogout,
  isLoggingOut,
  isMobileOpen,
  onMobileClose,
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
    <>
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onMobileClose}
        className={`fixed inset-0 z-40 bg-[#0f172a]/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileOpen
            ? "visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[270px] shrink-0 flex-col overflow-hidden border-r border-[#e2e8f0] bg-white shadow-2xl transition-transform duration-300 ease-out md:relative md:z-auto md:translate-x-0 md:shadow-none ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* Logo */}
      <div className="flex h-16 items-center px-6 pr-20 md:h-[76px] md:pr-6">
        <Logo size="sm" />
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation menu"
          className="absolute right-4 top-2 flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a] focus:outline-none focus:ring-4 focus:ring-[#22c55e]/10 md:hidden"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 pb-2 stagger">
        <p className="px-4 mb-3 text-[10px] font-bold text-[#475569] uppercase tracking-[0.1em]">
          Menu
        </p>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.path}
              onClick={onMobileClose}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-semibold mb-1 transition-all duration-300 relative ${
                isActive
                  ? "bg-[#e9fbee] text-[#064e2a] ring-1 ring-inset ring-[#bbf7d0] shadow-[0_14px_34px_-24px_rgba(10,159,67,0.55)]"
                  : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#24d653]" />
              )}
              <Icon
                size={20}
                className={`transition-all duration-300 ${
                  isActive
                    ? "text-[#0a9f43]"
                    : "text-[#64748b] group-hover:text-[#0a9f43] group-hover:scale-110"
                }`}
                aria-hidden="true"
              />
              {item.name}
              {isActive && (
                <span className="absolute right-3 h-2 w-2 rounded-full bg-[#24d653] shadow-[0_0_0_4px_rgba(36,214,83,0.16)]" />
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
            aria-label="Open user menu"
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
              className={`text-[#64748b] transition-transform duration-200 group-hover:text-[#0f172a] ${
                isOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>

          {isOpen && (
            <div
              className="absolute bottom-[calc(100%+0.65rem)] left-0 z-50 w-full overflow-hidden rounded-lg border border-[#e2e8f0] bg-white shadow-lg"
              role="menu"
            >
              <Link
                href="/settings"
                onClick={() => {
                  setIsOpen(false);
                  onMobileClose();
                }}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#334155] transition hover:bg-[#f8fafc] hover:text-[#4f46e5]"
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
    </>
  );
}
