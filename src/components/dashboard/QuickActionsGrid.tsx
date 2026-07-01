import { Sparkles, ArrowRight, Target, Brain, Calendar, BarChart3 } from "lucide-react";

export function QuickActionsGrid() {
  const quickActions = [
    {
      title: "Create Study Plan",
      description: "AI generates a personalized schedule",
      icon: Target,
      color: "text-[#6366f1]",
      bg: "bg-[#eef2ff]",
      hoverBg: "hover:bg-[#e0e7ff]",
    },
    {
      title: "Start AI Session",
      description: "Chat with your AI study assistant",
      icon: Brain,
      color: "text-[#8b5cf6]",
      bg: "bg-[#f5f3ff]",
      hoverBg: "hover:bg-[#ede9fe]",
    },
    {
      title: "Schedule Review",
      description: "Set up spaced repetition reminders",
      icon: Calendar,
      color: "text-[#06b6d4]",
      bg: "bg-[#ecfeff]",
      hoverBg: "hover:bg-[#cffafe]",
    },
    {
      title: "View Analytics",
      description: "Track your learning progress",
      icon: BarChart3,
      color: "text-[#10b981]",
      bg: "bg-[#ecfdf5]",
      hoverBg: "hover:bg-[#d1fae5]",
    },
  ];

  return (
    <div className="animate-fade-in-up" style={{ animationDelay: "0.3s", opacity: 0 }}>
      <h2 className="text-[18px] font-bold text-[#0f172a] mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-[#6366f1]" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              className={`group text-left p-5 rounded-2xl border border-[#e2e8f0] bg-white card-hover transition-all duration-300 ${action.hoverBg}`}
            >
              <div
                className={`w-11 h-11 ${action.bg} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon size={20} className={action.color} />
              </div>
              <p className="text-[14px] font-bold text-[#0f172a] mb-1 flex items-center gap-1">
                {action.title}
                <ArrowRight
                  size={14}
                  className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#94a3b8]"
                />
              </p>
              <p className="text-[12px] text-[#94a3b8] font-medium">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
