"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  BookOpen,
  CheckCircle,
  Check,
} from "lucide-react";
import Link from "next/link";

interface StudyPlan {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  isCompleted: boolean;
}

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  const resolvedParams = use(params);
  const planId = resolvedParams.id;

  useEffect(() => {
    const fetchPlanDetail = async () => {
      try {
        const res = await fetch(`/api/study-plans/${planId}`);
        if (res.ok) {
          const data = await res.json();
          setPlan(data.plan);
        } else {
          router.push("/study-plans");
        }
      } catch (error) {
        console.error("Failed to fetch plan detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanDetail();
  }, [planId, router]);

  const handleMarkAsCompleted = async () => {
    if (!plan || plan.isCompleted || isUpdating) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/study-plans/${planId}`, {
        method: "PUT",
      });

      if (res.ok) {
        setPlan((prev) => (prev ? { ...prev, isCompleted: true } : null));
      } else {
        alert("Failed to update plan status.");
      }
    } catch (error) {
      console.error("Error updating plan:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-10 h-10 border-4 border-[#6366f1]/20 border-t-[#6366f1] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <Link
        href="/study-plans"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#64748b] hover:text-[#6366f1] transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
        Back to Study Plans
      </Link>

      <div className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef2ff] text-[#6366f1] text-[12px] font-bold">
            <BookOpen className="w-3.5 h-3.5" /> AI Generated Roadmap
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
            {plan.title}
          </h1>
          <p className="text-[13px] font-medium text-[#64748b] flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-[#94a3b8]" /> Created on{" "}
            {new Date(plan.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div>
          <button
            onClick={handleMarkAsCompleted}
            disabled={plan.isCompleted || isUpdating}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold transition-all duration-300 ${
              plan.isCompleted
                ? "bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] cursor-not-allowed"
                : "bg-[#f8fafc] hover:bg-[#eef2ff] text-[#64748b] hover:text-[#6366f1] border border-[#e2e8f0] hover:border-[#6366f1] active:scale-[0.98]"
            }`}
          >
            {plan.isCompleted ? (
              <>
                <Check className="w-4 h-4" /> Completed
              </>
            ) : isUpdating ? (
              "Updating..."
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Mark as Completed
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="whitespace-pre-line text-[#334155] text-[15px] leading-relaxed font-medium space-y-4">
          {plan.description}
        </div>
      </div>
    </div>
  );
}
