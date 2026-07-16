"use client";

import { Search, Bell } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="h-[72px] bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0] flex items-center justify-between px-8 shrink-0 animate-fade-in">
      {/* Search Bar */}
      <div className="relative w-full max-w-lg group">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b] group-focus-within:text-[#087b36] transition-colors duration-200"
          aria-hidden="true"
        />
        <input
          type="text"
          aria-label="Search courses, plans, and notes"
          placeholder="Search courses, plans, notes..."
          className="w-full h-11 pl-11 pr-4 text-[13px] bg-[#f1f5f9] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0a9f43]/20 focus:bg-white focus:border-[#0a9f43]/30 transition-all duration-300 placeholder:text-[#64748b]"
        />
        <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-0.5 bg-white border border-[#e2e8f0] rounded-md text-[10px] text-[#475569] font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-6">
        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Notifications"
          className="relative p-2.5 text-[#64748b] hover:text-[#087b36] hover:bg-[#f1f5f9] rounded-xl transition-all duration-300 group"
        >
          <Bell
            size={20}
            className="group-hover:animate-wiggle transition-transform"
            aria-hidden="true"
          />
          <span
            className="absolute top-2 right-2 w-2 h-2 bg-[#f43f5e] rounded-full ring-2 ring-white"
            aria-hidden="true"
          />
        </button>

        {/* Divider */}
        <div className="w-px h-9 bg-[#e2e8f0]" />
      </div>
    </header>
  );
}
