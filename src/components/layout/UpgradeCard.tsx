import { Sparkles } from "lucide-react";

export function UpgradeCard() {
  return (
    <div className="mx-3 mb-3">
      <div className="relative bg-gradient-to-br from-[#6366f1]/10 via-[#8b5cf6]/10 to-[#a855f7]/10 rounded-2xl p-4 border border-[#6366f1]/15 overflow-hidden">
        {/* Floating decoration */}
        <div className="absolute -top-2 -right-2 w-12 h-12 bg-[#6366f1]/10 rounded-full animate-float" />
        <div className="absolute bottom-1 left-2 w-6 h-6 bg-[#8b5cf6]/15 rounded-full animate-float-slow" />

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-[#6366f1]" />
            <span className="text-[12px] font-bold text-[#6366f1] uppercase tracking-wide">
              Pro Features
            </span>
          </div>
          <p className="text-[12px] text-[#64748b] leading-relaxed mb-3">
            Unlock AI-powered study optimization and advanced analytics.
          </p>
          <button className="w-full py-2 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white text-[12px] font-bold rounded-lg hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300 active:scale-[0.97]">
            Upgrade Now ✨
          </button>
        </div>
      </div>
    </div>
  );
}
