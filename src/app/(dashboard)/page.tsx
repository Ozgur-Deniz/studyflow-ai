"use client";

import { useState, useEffect } from "react";
import { getHeatmapData } from "@/app/actions/heatmap.actions";
import { AIRecommendationCard } from "@/components/dashboard/AIRecommendationCard";
import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import {
  StudyActivityHeatmap,
  type HeatmapDataPoint,
} from "@/components/dashboard/StudyActivityHeatmap";

interface DashboardStats {
  activeStudyPlans: number;
  aiConversations: number;
  totalStudyHours: number;
  currentStreak: number;
  flashcardDecks: number;
  quizzesSolved: number;
}

const DASHBOARD_REVEAL_TIMING = {
  quickActions: 120,
  studyActivity: 1450,
  recommendations: 7400,
};

const DEFAULT_REVEAL_STATE = {
  quickActions: false,
  studyActivity: false,
  recommendations: false,
};

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
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const [revealState, setRevealState] = useState(DEFAULT_REVEAL_STATE);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);

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

        const { heatmapData } = await getHeatmapData();
        setHeatmapData(heatmapData);
      } catch (error) {
        console.error("[Dashboard] Error during data fetch:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const revealEverything = () => {
      setRevealState({
        quickActions: true,
        studyActivity: true,
        recommendations: true,
      });
    };
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncMotionPreference = () => {
      setShouldReduceMotion(motionQuery.matches);

      if (motionQuery.matches) {
        revealEverything();
      }
    };

    syncMotionPreference();

    if (motionQuery.matches) {
      motionQuery.addEventListener("change", syncMotionPreference);

      return () => {
        motionQuery.removeEventListener("change", syncMotionPreference);
      };
    }

    const timers = [
      window.setTimeout(() => {
        setRevealState((current) => ({
          ...current,
          quickActions: true,
        }));
      }, DASHBOARD_REVEAL_TIMING.quickActions),
      window.setTimeout(() => {
        setRevealState((current) => ({
          ...current,
          studyActivity: true,
        }));
      }, DASHBOARD_REVEAL_TIMING.studyActivity),
      window.setTimeout(() => {
        setRevealState((current) => ({
          ...current,
          recommendations: true,
        }));
      }, DASHBOARD_REVEAL_TIMING.recommendations),
    ];

    motionQuery.addEventListener("change", syncMotionPreference);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      motionQuery.removeEventListener("change", syncMotionPreference);
    };
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
      <QuickActionsGrid
        stats={stats}
        isLoading={isLoading}
        isRevealed={revealState.quickActions}
        shouldReduceMotion={shouldReduceMotion}
      />

      <div
        className={`transition-[opacity,transform] duration-[640ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          revealState.studyActivity || shouldReduceMotion
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0"
        }`}
      >
        <StudyActivityHeatmap
          data={heatmapData}
          animationReady={revealState.studyActivity || shouldReduceMotion}
        />
      </div>

      <div
        className={`flex transition-[opacity,transform] duration-[640ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          revealState.recommendations || shouldReduceMotion
            ? "translate-y-0 opacity-100"
            : "translate-y-5 opacity-0"
        }`}
      >
        <AIRecommendationCard />
      </div>
    </div>
  );
}
