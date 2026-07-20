import Link from "next/link";
import { Sparkles, ArrowRight, Target, Brain, Layers, ClipboardList } from "lucide-react";

interface QuickActionsGridProps {
  stats: {
    activeStudyPlans: number;
    aiConversations: number;
    flashcardDecks: number;
    quizzesSolved: number;
  };
  isLoading?: boolean;
  isRevealed?: boolean;
  shouldReduceMotion?: boolean;
}

export function QuickActionsGrid({
  stats,
  isLoading = false,
  isRevealed = true,
  shouldReduceMotion = false,
}: QuickActionsGridProps) {
  const quickActions = [
    {
      title: "Create Study Plan",
      description: "AI generates a personalized schedule",
      metricLabel: "Active plans",
      metricValue: stats.activeStudyPlans,
      icon: Target,
      color: "text-[#c026d3]",
      bg: "bg-[#fdf4ff]",
      ring: "ring-[#f5d0fe]",
      accent: "from-[#c026d3]",
      href: "/study-plans",
    },
    {
      title: "Start AI Session",
      description: "Chat with your AI study assistant",
      metricLabel: "AI conversations",
      metricValue: stats.aiConversations,
      icon: Brain,
      color: "text-[#7c3aed]",
      bg: "bg-[#f5f3ff]",
      ring: "ring-[#ddd6fe]",
      accent: "from-[#7c3aed]",
      href: "/ai-assistant",
    },
    {
      title: "Study Flashcards",
      description: "Review flashcards for active recall",
      metricLabel: "Flashcard decks",
      metricValue: stats.flashcardDecks,
      icon: Layers,
      color: "text-[#f59e0b]",
      bg: "bg-[#fffbeb]",
      ring: "ring-[#fde68a]",
      accent: "from-[#f59e0b]",
      href: "/flashcards",
    },
    {
      title: "Solve a Quiz",
      description: "Test your knowledge with quizzes",
      metricLabel: "Total quizzes",
      metricValue: stats.quizzesSolved,
      icon: ClipboardList,
      color: "text-[#0284c7]",
      bg: "bg-[#f0f9ff]",
      ring: "ring-[#bae6fd]",
      accent: "from-[#0284c7]",
      href: "/quizzes",
    },
  ];
  const shouldShow = isRevealed || shouldReduceMotion;

  return (
    <div>
      <h2
        className={`text-[18px] font-bold text-[#0f172a] mb-4 flex items-center gap-2 transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          shouldShow ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
      >
        <Sparkles size={18} className="text-[#0a9f43]" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className={`group relative flex min-h-[190px] flex-col overflow-hidden text-left p-5 rounded-2xl border border-[#e2e8f0] bg-white card-hover transition-[opacity,transform,border-color,box-shadow] duration-[560ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[#cbd5e1] ${
                shouldShow
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
              style={{
                transitionDelay: shouldReduceMotion
                  ? "0ms"
                  : `${180 + index * 130}ms`,
              }}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.accent} to-transparent rounded-bl-full opacity-40 transition-all duration-300 group-hover:opacity-55 group-hover:scale-110`}
              />
              <div className="relative flex h-full flex-col">
                <div
                  className={`w-12 h-12 ${action.bg} rounded-xl flex items-center justify-center mb-4 ring-1 ${action.ring} group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={20} className={action.color} />
                </div>
                <p className="text-[15px] font-bold text-[#0f172a] mb-1 flex items-center gap-1">
                  {action.title}
                  <ArrowRight
                    size={14}
                    className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-[#64748b]"
                    aria-hidden="true"
                  />
                </p>
                <p className="text-[12px] leading-5 text-[#64748b] font-medium">
                  {action.description}
                </p>
                <div className="mt-auto pt-5 flex items-end justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569]">
                    {action.metricLabel}
                  </span>
                  <span className={`text-3xl font-black leading-none ${action.color}`}>
                    {isLoading ? "..." : action.metricValue}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
