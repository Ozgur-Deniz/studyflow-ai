"use client";

import { useState, useEffect } from "react";
import { BookOpen, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

// API'den gelecek planın veri tipi
interface StudyPlan {
  id: string;
  title: string;
  createdAt: string;
  isCompleted: boolean;
}

export function ActivePlansList() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bileşen ekrana basıldığında API'den planları çek
  useEffect(() => {
    const fetchPlans = async () => {
      try {
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
    };

    fetchPlans();
  }, []);

  return (
    <div className="bg-white p-7 rounded-2xl border border-[#e2e8f0] h-full shadow-sm animate-scale-in">
      <h3 className="text-[18px] font-extrabold text-[#0f172a] mb-6 flex items-center gap-2 tracking-tight">
        <BookOpen className="w-5 h-5 text-[#6366f1]" /> Active Plans
      </h3>

      {isLoading ? (
        // Yüklenme Durumu (Spinner)
        <div className="flex justify-center items-center h-48">
          <div className="w-8 h-8 border-4 border-[#6366f1]/20 border-t-[#6366f1] rounded-full animate-spin"></div>
        </div>
      ) : plans.length === 0 ? (
        // Boş Durum (Hiç plan yoksa)
        <div className="flex flex-col items-center justify-center h-48 text-center px-4">
          <div className="w-12 h-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-[#94a3b8]" />
          </div>
          <p className="text-[13px] font-medium text-[#64748b]">
            You don't have any active study plans yet. Use the AI generator to
            create your first one!
          </p>
        </div>
      ) : (
        // Plan Listesi
        <div className="space-y-4">
          {plans.map((plan) => (
            <Link
              href={`/study-plans/${plan.id}`}
              key={plan.id}
              className="group p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] hover:border-[#6366f1] hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col gap-3"
            >
              <h4 className="font-bold text-[#0f172a] text-[14px] line-clamp-2 leading-snug">
                {plan.title}
              </h4>
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
          ))}
        </div>
      )}
    </div>
  );
}
