"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import Link from "next/link";

// Data type for plans returned by the API
interface StudyPlan {
  id: string;
  title: string;
  createdAt: string;
  isCompleted: boolean;
}

interface ActivePlansListProps {
  refreshTrigger?: number;
}

export function ActivePlansList({ refreshTrigger }: ActivePlansListProps) {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/study-plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("[ActivePlansList] Failed to fetch plans:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch plans when the component mounts and when refreshTrigger changes
  useEffect(() => {
    queueMicrotask(() => {
      void fetchPlans();
    });
  }, [fetchPlans, refreshTrigger]);

  const handleDeletePlan = async (planId: string) => {
    if (deletingPlanId) {
      return;
    }

    const shouldDelete = window.confirm(
      "Are you sure you want to delete this study plan?",
    );

    if (!shouldDelete) {
      return;
    }

    setDeletingPlanId(planId);

    try {
      const response = await fetch(`/api/study-plans/${planId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(
          `Delete study plan request failed with status ${response.status}.`,
        );
      }

      setPlans((currentPlans) =>
        currentPlans.filter((plan) => plan.id !== planId),
      );
    } catch (error) {
      console.error("[ActivePlansList] Failed to delete plan:", error);
      window.alert("Failed to delete the study plan.");
    } finally {
      setDeletingPlanId(null);
    }
  };

  return (
    <div className="bg-white p-7 rounded-2xl border border-[#e2e8f0] h-full shadow-sm animate-scale-in">
      <h3 className="text-[18px] font-extrabold text-[#0f172a] mb-6 flex items-center gap-2 tracking-tight">
        <BookOpen className="w-5 h-5 text-[#6366f1]" /> Active Plans
      </h3>

      {isLoading ? (
        // Loading state
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-[#6366f1]/20 border-t-[#6366f1] rounded-full animate-spin"></div>
        </div>
      ) : plans.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center justify-center h-48 text-center px-4">
          <div className="w-12 h-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-[#94a3b8]" />
          </div>
          <p className="text-[13px] font-medium text-[#64748b]">
            You don&apos;t have any active study plans yet. Use the AI generator to
            create your first one!
          </p>
        </div>
      ) : (
        // Plan list
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`group relative rounded-xl border bg-[#f8fafc] transition-all duration-300 hover:bg-white hover:shadow-md ${
                plan.isCompleted
                  ? "border-emerald-300 hover:border-emerald-400"
                  : "border-[#e2e8f0] hover:border-[#6366f1]"
              }`}
            >
              <Link
                href={`/study-plans/${plan.id}`}
                className="flex cursor-pointer flex-col gap-3 p-4 pr-12"
              >
                <div className="flex items-start gap-2">
                  <h4 className="min-w-0 flex-1 font-bold text-[#0f172a] text-[14px] line-clamp-2 leading-snug">
                    {plan.title}
                  </h4>
                  {plan.isCompleted && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[12px] font-bold text-[#64748b]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#94a3b8]" />
                    {new Date(plan.createdAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1 text-[#6366f1] group-hover:translate-x-1 transition-transform duration-300">
                    View Plan <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => void handleDeletePlan(plan.id)}
                disabled={deletingPlanId === plan.id}
                className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#94a3b8] transition hover:bg-rose-50 hover:text-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Delete study plan"
              >
                {deletingPlanId === plan.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
