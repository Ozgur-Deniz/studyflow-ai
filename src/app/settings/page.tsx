"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart, Menu, User, X } from "lucide-react";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { PerformanceStats } from "@/components/settings/PerformanceStats";
import { Logo } from "@/components/ui/Logo";

const tabs = [
  {
    id: "account",
    label: "Account",
    icon: User,
  },
  {
    id: "performance",
    label: "Performance",
    icon: BarChart,
  },
] as const;

type SettingsTab = (typeof tabs)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const ActiveContent =
    activeTab === "account" ? AccountSettings : PerformanceStats;

  return (
    <div className="flex min-h-screen bg-[#f5f7fa] text-[#0f172a]">
      <button
        type="button"
        onClick={() => setIsSidebarOpen(false)}
        aria-label="Close settings menu"
        className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm transition-opacity duration-300 min-[1000px]:hidden ${
          isSidebarOpen
            ? "visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
      />

      <aside
        id="settings-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(240px,calc(100vw-2rem))] shrink-0 flex-col border-r border-[#e2e8f0] bg-white px-4 py-5 shadow-2xl transition-transform duration-300 ease-out min-[1000px]:relative min-[1000px]:inset-auto min-[1000px]:z-auto min-[1000px]:w-[280px] min-[1000px]:translate-x-0 min-[1000px]:px-6 min-[1000px]:py-6 min-[1000px]:shadow-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center pr-12 min-[1000px]:pr-0">
          <div className="origin-left scale-[0.82] min-[1000px]:scale-100">
            <Logo size="sm" />
          </div>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close settings menu"
            className="absolute right-3 top-3 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[#0f172a] focus:outline-none focus:ring-4 focus:ring-[#0a9f43]/10 min-[1000px]:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          <Link
            href="/"
            className="group mb-5 flex h-12 items-center gap-2.5 rounded-xl px-3 text-base font-semibold text-[#0a9f43] transition-all duration-300 hover:-translate-x-0.5 hover:bg-[#ecfdf3] hover:text-[#087b36] hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#0a9f43]/10"
          >
            <ArrowLeft className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Dashboard
          </Link>

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-[#ecfdf3] text-[#0a9f43] shadow-sm"
                    : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    isActive
                      ? "border-[#bbf7d0] bg-white text-[#0a9f43]"
                      : "border-[#e2e8f0] bg-white text-[#475569]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#e2e8f0] bg-white px-4 min-[1000px]:hidden">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open settings menu"
            aria-expanded={isSidebarOpen}
            aria-controls="settings-sidebar"
            className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] shadow-sm transition-colors hover:bg-[#f8fafc] hover:text-[#0a9f43] focus:outline-none focus:ring-4 focus:ring-[#0a9f43]/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748b]">
              Settings
            </p>
            <p className="truncate text-base font-semibold text-[#0f172a]">
              {activeTab === "account" ? "Account" : "Performance"}
            </p>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl animate-fade-in-up">
            <ActiveContent />
          </div>
        </section>
      </main>
    </div>
  );
}
