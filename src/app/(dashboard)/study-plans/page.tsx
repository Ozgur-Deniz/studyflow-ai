"use client";

import { useState, useCallback } from "react";
import { GeneratePlanForm } from "@/components/study-plans/GeneratePlanForm";
import { ActivePlansList } from "@/components/study-plans/ActivePlansList";

export default function StudyPlansPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePlanGenerated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-[#0f172a] mb-2 tracking-tight">
          Study Plans
        </h1>
        <p className="text-[#64748b]">
          Design your learning journey with AI-powered schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-2">
          <GeneratePlanForm onPlanGenerated={handlePlanGenerated} />
        </div>
        <div className="lg:col-span-1">
          <ActivePlansList refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </div>
  );
}
