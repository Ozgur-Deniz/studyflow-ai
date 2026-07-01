import { Zap } from "lucide-react";

interface LogoProps {
  size?: "sm" | "lg";
}

export function Logo({ size = "sm" }: LogoProps) {
  const isLg = size === "lg";

  return (
    <div className={`flex items-center ${isLg ? "gap-3" : "gap-3"}`}>
      <div
        className={`${
          isLg ? "w-20 h-20 rounded-2xl border border-white/25 shadow-2xl shadow-black/10" : "w-10 h-10 rounded-xl shadow-lg shadow-indigo-200"
        } bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center transition-transform duration-300 hover:scale-110 ${isLg ? "hover:rotate-6 bg-white/15 backdrop-blur-md" : "hover:rotate-3"}`}
      >
        <Zap size={isLg ? 36 : 20} className="text-white" fill="white" />
      </div>
      <div>
        <span className={`${isLg ? "text-[40px]" : "text-[18px]"} font-extrabold tracking-tight`}>
          <span className={isLg ? "text-white" : "gradient-text"}>Study</span>
          <span className={isLg ? "text-white" : "text-[#0f172a]"}>Flow</span>
        </span>
        {!isLg && (
          <p className="text-[10px] text-[#94a3b8] font-medium -mt-0.5 tracking-wider uppercase">
            AI Platform
          </p>
        )}
      </div>
    </div>
  );
}
