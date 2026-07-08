"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart, User } from "lucide-react";
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
  const ActiveContent =
    activeTab === "account" ? AccountSettings : PerformanceStats;

  return (
    <div className="flex min-h-screen bg-[#f5f7fa] text-[#0f172a]">
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-[#e2e8f0] bg-white px-6 py-6">
        <Logo size="sm" />

        <nav className="mt-8 space-y-2">
          <Link
            href="/"
            className="group mb-5 flex h-12 items-center gap-2.5 rounded-xl px-3 text-base font-semibold text-[#6366f1] transition-all duration-300 hover:-translate-x-0.5 hover:bg-[#eef2ff] hover:text-[#4f46e5] hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-[#6366f1]/10"
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
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                  isActive
                    ? "bg-[#eef2ff] text-[#6366f1] shadow-sm"
                    : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    isActive
                      ? "border-[#c7d2fe] bg-white text-[#6366f1]"
                      : "border-[#e2e8f0] bg-white text-[#94a3b8]"
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
        <section className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto max-w-5xl animate-fade-in-up">
            <ActiveContent />
          </div>
        </section>
      </main>
    </div>
  );
}
