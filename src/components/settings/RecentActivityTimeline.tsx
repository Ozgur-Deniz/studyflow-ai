"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Layers,
  MessageCircle,
  Sparkles,
} from "lucide-react";

export interface PerformanceActivity {
  id: string;
  actionType: string;
  points: number;
  durationMinutes: number;
  createdAt: string;
}

type ActivityRange = "7d" | "30d" | "all";

const rangeOptions: Array<{ value: ActivityRange; label: string }> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All" },
];

const activityMeta = {
  POMODORO_FOCUS: {
    title: "Focus session completed",
    detail: (activity: PerformanceActivity) =>
      activity.durationMinutes > 0
        ? `${activity.durationMinutes} minutes of focused study`
        : "Focused study session",
    icon: Clock3,
    iconClassName: "bg-emerald-50 text-emerald-700",
  },
  QUIZ_COMPLETED: {
    title: "Quiz completed",
    detail: () => "Completed a quiz and recorded the result",
    icon: CheckCircle2,
    iconClassName: "bg-rose-50 text-rose-600",
  },
  FLASHCARD_REVIEWED: {
    title: "Flashcard reviewed",
    detail: () => "Reviewed a card with active recall",
    icon: Layers,
    iconClassName: "bg-amber-50 text-amber-700",
  },
  FLASHCARD_DECK_COMPLETED: {
    title: "Flashcard deck completed",
    detail: () => "Finished reviewing a complete deck",
    icon: Layers,
    iconClassName: "bg-orange-50 text-orange-700",
  },
  STUDY_PLAN_CREATED: {
    title: "Study plan created",
    detail: () => "Generated a new learning roadmap",
    icon: BookOpen,
    iconClassName: "bg-fuchsia-50 text-fuchsia-700",
  },
  STUDY_PLAN_COMPLETED: {
    title: "Study plan completed",
    detail: () => "Finished an active study plan",
    icon: BookOpen,
    iconClassName: "bg-violet-50 text-violet-700",
  },
  AI_MESSAGE_SENT: {
    title: "AI assistant used",
    detail: () => "Continued an AI-assisted study conversation",
    icon: MessageCircle,
    iconClassName: "bg-teal-50 text-teal-700",
  },
  AI_RESOURCE_GENERATED: {
    title: "AI study resource generated",
    detail: () => "Created flashcards or a quiz with AI",
    icon: Brain,
    iconClassName: "bg-sky-50 text-sky-700",
  },
} satisfies Record<
  string,
  {
    title: string;
    detail: (activity: PerformanceActivity) => string;
    icon: typeof Sparkles;
    iconClassName: string;
  }
>;

const fallbackMeta = {
  title: "Study activity recorded",
  detail: () => "A learning action was added to your performance history",
  icon: Sparkles,
  iconClassName: "bg-slate-100 text-slate-600",
};

function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function getLocalDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatGroupLabel(value: Date) {
  const activityDay = startOfLocalDay(value);
  const today = startOfLocalDay(new Date());
  const differenceInDays = Math.round(
    (today.getTime() - activityDay.getTime()) / 86_400_000,
  );

  if (differenceInDays === 0) {
    return "Today";
  }

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: activityDay.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(activityDay);
}

function formatActivityTime(value: Date) {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function RecentActivityTimeline({
  activities,
}: {
  activities: PerformanceActivity[];
}) {
  const [range, setRange] = useState<ActivityRange>("7d");
  const [isOpen, setIsOpen] = useState(false);

  const groups = useMemo(() => {
    const now = new Date();
    const rangeDays = range === "7d" ? 7 : range === "30d" ? 30 : null;
    const cutoff = rangeDays
      ? new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - (rangeDays - 1),
        ).getTime()
      : Number.NEGATIVE_INFINITY;
    const groupedActivities = new Map<
      string,
      { date: Date; activities: PerformanceActivity[] }
    >();

    activities.forEach((activity) => {
      const createdAt = new Date(activity.createdAt);

      if (Number.isNaN(createdAt.getTime()) || createdAt.getTime() < cutoff) {
        return;
      }

      const key = getLocalDateKey(createdAt);
      const existingGroup = groupedActivities.get(key);

      if (existingGroup) {
        existingGroup.activities.push(activity);
      } else {
        groupedActivities.set(key, {
          date: createdAt,
          activities: [activity],
        });
      }
    });

    return Array.from(groupedActivities.values());
  }, [activities, range]);

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        aria-expanded={isOpen}
        aria-controls="recent-activity-content"
        className="group flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-300 hover:bg-[#f8fafc] focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#0a9f43]/10"
      >
        <span>
          <h3 className="text-lg font-semibold tracking-tight text-[#0f172a]">
            Recent Activity
          </h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Your tracked learning actions, grouped by day.
          </p>
        </span>

        <span className="flex shrink-0 items-center gap-3">
          <span className="hidden text-xs font-semibold text-[#64748b] sm:inline">
            {activities.length} tracked {activities.length === 1 ? "action" : "actions"}
          </span>
          <span className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#e2e8f0] bg-white text-[#64748b] shadow-sm transition-all duration-300 group-hover:border-[#bbf7d0] group-hover:bg-[#ecfdf3] group-hover:text-[#087b36] group-hover:shadow-md">
            <ChevronDown
              className={`h-5 w-5 transition-transform duration-300 ease-out ${
                isOpen ? "rotate-180" : "rotate-0"
              }`}
              aria-hidden="true"
            />
          </span>
        </span>
      </button>

      <div
        id="recent-activity-content"
        aria-hidden={!isOpen}
        className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`border-t border-[#e2e8f0] transition-[opacity,transform] duration-300 ${
              isOpen
                ? "translate-y-0 opacity-100 delay-100"
                : "-translate-y-2 pointer-events-none opacity-0"
            }`}
          >
            <div className="flex justify-end px-6 py-4">
              <div className="inline-flex w-fit rounded-full border border-[#e2e8f0] bg-[#f8fafc] p-1">
                {rangeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRange(option.value)}
                    aria-pressed={range === option.value}
                    tabIndex={isOpen ? 0 : -1}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      range === option.value
                        ? "bg-[#0a9f43] text-white shadow-sm"
                        : "text-[#64748b] hover:bg-white hover:text-[#0f172a] hover:shadow-sm"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="px-6 pb-12 pt-8 text-center">
                <Clock3 className="mx-auto h-7 w-7 text-[#94a3b8]" />
                <p className="mt-3 text-sm font-semibold text-[#0f172a]">
                  No activity in this period
                </p>
                <p className="mt-1 text-sm text-[#64748b]">
                  Completed study actions will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="max-h-[640px] overflow-y-auto px-6 pb-2">
                {groups.map((group) => (
                  <div key={getLocalDateKey(group.date)} className="py-4">
                    <div className="mb-3 flex items-center gap-3">
                      <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                        {formatGroupLabel(group.date)}
                      </p>
                      <span className="h-px flex-1 bg-[#e2e8f0]" />
                      <span className="text-xs font-medium text-[#94a3b8]">
                        {group.activities.length}{" "}
                        {group.activities.length === 1 ? "action" : "actions"}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {group.activities.map((activity) => {
                        const meta =
                          activityMeta[
                            activity.actionType as keyof typeof activityMeta
                          ] ?? fallbackMeta;
                        const Icon = meta.icon;
                        const createdAt = new Date(activity.createdAt);

                        return (
                          <div
                            key={activity.id}
                            className="group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-[#f8fafc]"
                          >
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta.iconClassName}`}
                            >
                              <Icon className="h-4.5 w-4.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-[#0f172a]">
                                {meta.title}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-[#64748b]">
                                {meta.detail(activity)}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-xs font-semibold text-[#0a9f43]">
                                +{activity.points} XP
                              </p>
                              <p className="mt-1 text-[11px] font-medium text-[#94a3b8]">
                                {formatActivityTime(createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
