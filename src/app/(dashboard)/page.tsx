"use client";

import { useState, useEffect } from "react";
import { BookOpen, MessageSquare, Layers, ClipboardList } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { AIRecommendationCard } from "@/components/dashboard/AIRecommendationCard";
import { AchievementsCard } from "@/components/dashboard/AchievementsCard";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";

interface DashboardStats {
  activeStudyPlans: number;
  aiConversations: number;
  totalStudyHours: number;
  currentStreak: number;
  flashcardDecks: number;
  quizzesSolved: number;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    activeStudyPlans: 0,
    aiConversations: 0,
    totalStudyHours: 0,
    currentStreak: 0,
    flashcardDecks: 0,
    quizzesSolved: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Fetch Session
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setUserName(sessionData.user.name);
        }

        // 2. Fetch Stats
        const statsRes = await fetch("/api/dashboard/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
      } catch (error) {
        console.error("[Dashboard] Error during data fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Area */}
      <div>
        <h1 className="text-3xl font-bold text-[#0f172a] mb-2 tracking-tight">
          {isLoading ? (
            "Loading..."
          ) : (
            <>
              Welcome back, <span className="gradient-text">{userName}!</span>
            </>
          )}{" "}
          👋
        </h1>
        <p className="text-[#64748b]">
          Here is your study overview. Keep up the great work!
        </p>
      </div>

      {/* Dynamic Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="ACTIVE STUDY PLANS"
          value={isLoading ? "..." : stats.activeStudyPlans.toString()}
          change="+0%"
          icon={BookOpen}
          gradient="from-[#6366f1] to-[#8b5cf6]"
          iconBg="bg-[#eef2ff]"
          shadowColor="hover:shadow-indigo-100"
          href="/study-plans"
        />
        <StatCard
          title="AI CONVERSATIONS"
          value={isLoading ? "..." : stats.aiConversations.toString()}
          change="+0%"
          icon={MessageSquare}
          gradient="from-[#06b6d4] to-[#0891b2]"
          iconBg="bg-[#ecfeff]"
          shadowColor="hover:shadow-cyan-100"
          href="/ai-assistant"
        />
        <StatCard
          title="FLASHCARD DECKS"
          value={isLoading ? "..." : stats.flashcardDecks.toString()}
          change="+0%"
          icon={Layers}
          gradient="from-[#f59e0b] to-[#d97706]"
          iconBg="bg-[#fffbeb]"
          shadowColor="hover:shadow-amber-100"
          href="/flashcards"
        />
        <StatCard
          title="QUIZZES COMPLETED"
          value={isLoading ? "..." : stats.quizzesSolved.toString()}
          change="+0%"
          icon={ClipboardList}
          gradient="from-[#10b981] to-[#059669]"
          iconBg="bg-[#ecfdf5]"
          shadowColor="hover:shadow-emerald-100"
          href="/quizzes"
        />
      </div>

      {/* Quick Actions */}
      <QuickActionsGrid />

      {/* Bottom Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex">
          <AIRecommendationCard />
        </div>
        <div className="lg:col-span-1 flex">
          <AchievementsCard stats={stats} />
        </div>
      </div>
    </div>
  );
}
