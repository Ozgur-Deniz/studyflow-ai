"use client";

import { useState } from "react";
import { Sparkles, Target, Clock } from "lucide-react";

interface GeneratePlanFormProps {
  onPlanGenerated?: () => void;
}

export function GeneratePlanForm({ onPlanGenerated }: GeneratePlanFormProps) {
  const [topic, setTopic] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const response = await fetch("/api/study-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, timeframe }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(
          "[Study Plans Page] Plan successfully generated:",
          data.plan.title,
        );

        // Formu temizle
        setTopic("");
        setTimeframe("");

        // Notify the parent component that a new plan was created
        onPlanGenerated?.();
      } else {
        const errorData = await response.json();
        alert(errorData.message || "Something went wrong.");
      }
    } catch (error) {
      console.error("[Study Plans Page] Connection error:", error);
      alert("Failed to connect to the server.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-7 rounded-2xl border border-[#e2e8f0] animate-scale-in relative overflow-hidden h-full shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] rounded-xl flex items-center justify-center shadow-inner border border-white">
          <Sparkles className="text-[#6366f1]" size={22} />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#0f172a] tracking-tight mb-0.5">
            Generate New Plan
          </h2>
          <p className="text-sm font-medium text-[#64748b]">
            Tell AI what you want to achieve, and get a structured roadmap.
          </p>
        </div>
      </div>

      <form onSubmit={handleGeneratePlan} className="space-y-6">
        <div className="space-y-2.5">
          <label className="text-sm font-medium text-[#0f172a] flex items-center gap-2">
            <Target size={16} className="text-[#6366f1]" /> What do you want to
            learn?
          </label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Microprocessors final exam, Next.js routing..."
            className="w-full px-4 py-3.5 text-[14px] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#6366f1]/10 focus:bg-white focus:border-[#6366f1] transition-all duration-300 placeholder:text-[#94a3b8] text-[#0f172a] font-medium shadow-sm"
          />
        </div>

        <div className="space-y-2.5">
          <label className="text-sm font-medium text-[#0f172a] flex items-center gap-2">
            <Clock size={16} className="text-[#6366f1]" /> How much time do you
            have?
          </label>
          <input
            type="text"
            required
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            placeholder="e.g., 2 weeks, 5 days, 3 months..."
            className="w-full px-4 py-3.5 text-[14px] bg-[#f8fafc] border border-[#e2e8f0] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#6366f1]/10 focus:bg-white focus:border-[#6366f1] transition-all duration-300 placeholder:text-[#94a3b8] text-[#0f172a] font-medium shadow-sm"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="group w-full py-4 px-4 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#4f46e5] hover:to-[#7c3aed] hover:shadow-xl hover:shadow-indigo-200 text-white rounded-xl text-[15px] font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Sparkles size={18} className="animate-pulse" /> Generating
                Magic...
              </>
            ) : (
              <>
                <Sparkles size={18} className="group-hover:animate-pulse" />{" "}
                Generate My Plan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
