"use client";

import { useState, useEffect } from "react";
import { AIRecommendationCard } from "@/components/dashboard/AIRecommendationCard";
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

      {/* Quick Actions */}
      <QuickActionsGrid stats={stats} isLoading={isLoading} />

      <div className="flex">
        <AIRecommendationCard />
      </div>
    </div>
  );
}
