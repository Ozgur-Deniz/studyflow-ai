import { Logo } from "../ui/Logo";
import { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  label: string;
  desc: string;
}

interface AuthBrandingPanelProps {
  title: React.ReactNode;
  description: string;
  features: Feature[];
  gradient: "indigo" | "purple";
}

export function AuthBrandingPanel({
  title,
  description,
  features,
  gradient,
}: AuthBrandingPanelProps) {
  const gradientClass =
    gradient === "indigo"
      ? "from-[#6366f1] via-[#7c3aed] to-[#a855f7]"
      : "from-[#8b5cf6] via-[#7c3aed] to-[#6366f1]";

  return (
    <div
      className={`hidden lg:flex lg:w-[55%] bg-gradient-to-br ${gradientClass} relative overflow-hidden items-center justify-center p-16 animate-gradient`}
    >
      {/* Animated Decorative Elements */}
      <div className="absolute inset-0">
        <div className={`absolute top-[8%] ${gradient === "indigo" ? "left-[8%]" : "right-[8%]"} w-40 h-40 bg-white/8 rounded-full blur-2xl animate-float`} />
        <div className={`absolute bottom-[10%] ${gradient === "indigo" ? "right-[5%]" : "left-[5%]"} w-56 h-56 bg-white/5 rounded-full blur-3xl animate-float-slow`} />
        <div className={`absolute top-[40%] ${gradient === "indigo" ? "right-[20%]" : "left-[20%]"} w-24 h-24 bg-white/10 rounded-full blur-xl animate-float`} />
        <div className={`absolute bottom-[30%] ${gradient === "indigo" ? "left-[15%]" : "right-[15%]"} w-16 h-16 bg-white/8 rounded-full animate-float-slow`} />
        {/* Spinning ring */}
        <div className={`absolute top-[15%] right-[15%] w-20 h-20 border border-white/10 rounded-full animate-spin-slow`} />
        <div className={`absolute bottom-[20%] left-[30%] w-12 h-12 border border-white/5 rounded-full animate-spin-slow`} />
      </div>

      <div className="relative z-10 text-center max-w-lg animate-fade-in-up">
        {/* Animated Logo */}
        <div className="flex justify-center mb-10">
          <Logo size="lg" />
        </div>

        <h1 className="text-[40px] font-extrabold text-white mb-5 leading-[1.1] tracking-tight">
          {title}
        </h1>
        <p className="text-[17px] text-white/60 leading-relaxed max-w-md mx-auto">
          {description}
        </p>

        {/* Feature Cards */}
        <div className="flex flex-col gap-3 mt-10 max-w-sm mx-auto">
          {features.map((feature, i) => (
            <div
              key={feature.label}
              className={`flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-5 py-3.5 text-left hover:bg-white/15 transition-all duration-300 ${
                gradient === "indigo" ? "hover:translate-x-1" : "hover:-translate-x-1"
              } cursor-default`}
              style={{
                animationDelay: `${0.3 + i * 0.1}s`,
              }}
            >
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                <feature.icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-white">
                  {feature.label}
                </p>
                <p className="text-[11px] text-white/50">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
