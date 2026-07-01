"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Logo } from "../ui/Logo";
import { UserAvatar } from "../ui/UserAvatar";
import { UpgradeCard } from "./UpgradeCard";

interface SidebarProps {
  userName: string;
  userInitial: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export function Sidebar({
  userName,
  userInitial,
  onLogout,
  isLoggingOut,
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Study Plans", path: "/study-plans", icon: BookOpen },
    { name: "AI Assistant", path: "/ai-assistant", icon: Sparkles },
    { name: "Settings", path: "/settings", icon: Settings },
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

      {/* Upgrade Card */}
      <UpgradeCard />

      {/* User Profile & Logout */}
      <div className="p-3 border-t border-[#e2e8f0]">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#f1f5f9] transition-all duration-200 cursor-pointer mb-2 group">
          <UserAvatar
            initial={userInitial}
            name={userName}
            size="md"
            showName={true}
            showOnlineDot={true}
          />
          <ChevronDown size={14} className="text-[#94a3b8] group-hover:text-[#0f172a]" />
        </div>

        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-semibold text-[#f43f5e] bg-[#fff1f2] rounded-xl hover:bg-[#ffe4e6] hover:shadow-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          <LogOut size={16} />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
