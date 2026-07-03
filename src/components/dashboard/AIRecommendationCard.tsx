import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function AIRecommendationCard() {
  return (
    <div className="w-full relative bg-gradient-to-br from-[#6366f1] via-[#7c3aed] to-[#a855f7] p-7 rounded-2xl text-white overflow-hidden animate-scale-in">
      {/* Animated decorative elements */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full animate-float" />
      <div className="absolute bottom-4 right-16 w-20 h-20 bg-white/5 rounded-full animate-float-slow" />
      <div className="absolute top-1/2 right-1/3 w-6 h-6 bg-white/10 rounded-full animate-float" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full" />

      {/* Spinning decoration */}
      <div className="absolute top-6 right-6 w-16 h-16 border border-white/10 rounded-full animate-spin-slow" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full mb-5 border border-white/20">
          <Sparkles size={14} className="animate-pulse" />
          <span className="text-[12px] font-bold tracking-wide">
            AI RECOMMENDATION
          </span>
        </div>

        <h3 className="text-[24px] font-extrabold mb-3 leading-tight tracking-tight">
          Start Your First
          <br />
          Study Plan Today
        </h3>
        <p className="text-[14px] text-white/70 mb-6 leading-relaxed max-w-md">
          Our AI will analyze your learning goals and create a personalized
          study schedule optimized for maximum retention and efficiency.
        </p>

        <div className="flex items-center gap-3">
          <Link
            href="/study-plans"
            className="group bg-white text-[#6366f1] text-[13px] font-bold px-6 py-3 rounded-xl hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 active:scale-[0.97] flex items-center gap-2"
          >
            Get Started
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform duration-300"
            />
          </Link>
          <Link
            href="/ai-assistant"
            className="text-[13px] font-semibold text-white/80 hover:text-white px-4 py-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            AI Assistant
          </Link>
        </div>
      </div>
    </div>
  );
}
