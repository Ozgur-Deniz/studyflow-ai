import { ButtonHTMLAttributes, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  gradient?: "indigo" | "purple";
  children: ReactNode;
}

export function GradientButton({
  isLoading,
  loadingText = "Loading...",
  gradient = "indigo",
  children,
  ...props
}: GradientButtonProps) {
  const gradientClass =
    gradient === "indigo"
      ? "from-[#6366f1] to-[#8b5cf6] hover:shadow-indigo-200 focus:ring-[#6366f1]/20"
      : "from-[#8b5cf6] to-[#6366f1] hover:shadow-purple-200 focus:ring-[#8b5cf6]/20";

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`group w-full h-12 bg-gradient-to-r ${gradientClass} text-white text-[14px] font-bold rounded-xl hover:shadow-xl focus:ring-4 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {loadingText}
        </span>
      ) : (
        <>
          {children}
          <ArrowRight
            size={16}
            className="group-hover:translate-x-1 transition-transform duration-300"
          />
        </>
      )}
    </button>
  );
}
