"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  Loader2,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import {
  RecentActivityTimeline,
  type PerformanceActivity,
} from "@/components/settings/RecentActivityTimeline";

interface XpDataPoint {
  label: string;
  dateKey: string;
  xp: number;
  focusMinutes: number;
}

interface ActivityDataPoint {
  name: string;
  value: number;
  color: string;
}

interface PerformanceData {
  summary: {
    totalXp: number;
    todayXp: number;
    weeklyXp: number;
    weeklyTrend: number;
    currentStreak: number;
    longestStreak: number;
    totalFocusMinutes: number;
    averageSessionLength: number;
    bestFocusHour: string | null;
    totalMaterials: number;
  };
  charts: {
    weekly: XpDataPoint[];
    monthly: XpDataPoint[];
    activityDistribution: ActivityDataPoint[];
  };
  resources: {
    studyPlans: {
      total: number;
      active: number;
      completed: number;
      completionRate: number | null;
    };
    flashcards: {
      decks: number;
      cards: number;
    };
    quizzes: {
      total: number;
      completed: number;
      averageScore: number | null;
    };
    aiConversations: number;
  };
  recentActivity: PerformanceActivity[];
  hasActivity: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    value?: number;
    payload?: XpDataPoint;
  }>;
}

type ChartRange = "weekly" | "monthly";

const numberFormatter = new Intl.NumberFormat("en-US");

const formatNumber = (value: number) => numberFormatter.format(value);

const formatFocusTime = (focusMinutes: number) => {
  const focusHours = Math.floor(focusMinutes / 60);
  const remainingMinutes = focusMinutes % 60;

  if (focusHours <= 0) {
    return `${remainingMinutes}m`;
  }

  return remainingMinutes > 0
    ? `${focusHours}h ${remainingMinutes}m`
    : `${focusHours}h`;
};

const formatTrend = (trend: number) => {
  if (trend > 0) {
    return `+${trend}%`;
  }

  return `${trend}%`;
};

const CustomTooltip = ({ active, label, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;
  const focusMinutes = point?.focusMinutes ?? 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-4 py-3 text-white shadow-2xl shadow-slate-900/20 backdrop-blur-xl">
      <p className="text-xs font-medium text-slate-200">
        {label}
        {point?.dateKey ? ` · ${point.dateKey}` : ""}
      </p>
      <p className="mt-1 text-base font-semibold">
        {formatNumber(payload[0].value ?? 0)} XP
      </p>
      <p className="mt-1 text-xs text-slate-200">
        Focus time: {formatFocusTime(focusMinutes)}
      </p>
    </div>
  );
};

function LoadingState() {
  return (
    <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3 text-sm font-semibold text-[#64748b]">
        <Loader2 className="h-5 w-5 animate-spin text-[#0a9f43]" />
        Loading performance data...
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-5 text-sm text-rose-700">
      <div className="flex items-center gap-2 font-semibold">
        <AlertCircle className="h-4 w-4" />
        Performance data could not be loaded
      </div>
      <p className="mt-2 text-rose-600">{message}</p>
    </div>
  );
}

function EmptyChartState() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl bg-[#f8fafc] text-center">
      <div>
        <p className="text-sm font-semibold text-[#0f172a]">No study activity yet</p>
        <p className="mt-1 text-sm text-[#64748b]">
          XP and focus charts will appear after your first tracked activity.
        </p>
      </div>
    </div>
  );
}

export function PerformanceStats() {
  const [chartRange, setChartRange] = useState<ChartRange>("weekly");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPerformanceData() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch("/api/settings/performance", {
          cache: "no-store",
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as {
            error?: string;
            message?: string;
          } | null;

          throw new Error(
            body?.error ?? body?.message ?? "Unexpected performance API error.",
          );
        }

        const performanceData = (await response.json()) as PerformanceData;

        if (isMounted) {
          setData(performanceData);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unexpected performance API error.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadPerformanceData();

    return () => {
      isMounted = false;
    };
  }, []);

  const chartRanges = useMemo(
    () => ({
      weekly: {
        label: "Weekly",
        description: "Last 7 days of XP and focus time.",
        data: data?.charts.weekly ?? [],
      },
      monthly: {
        label: "Monthly",
        description: "Last 28 days of XP and focus time.",
        data: data?.charts.monthly ?? [],
      },
    }),
    [data],
  );
  const activeChartRange = chartRanges[chartRange];

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!data) {
    return <ErrorState message="Performance response was empty." />;
  }

  const statCards = [
    {
      label: "Total XP",
      value: formatNumber(data.summary.totalXp),
      trend: formatTrend(data.summary.weeklyTrend),
      icon: Sparkles,
      iconClassName: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Current Streak",
      value: `${data.summary.currentStreak} days`,
      trend: `Best ${data.summary.longestStreak}`,
      icon: Flame,
      iconClassName: "bg-orange-50 text-orange-600",
    },
    {
      label: "Materials Created",
      value: formatNumber(data.summary.totalMaterials),
      trend: "From DB",
      icon: Layers,
      iconClassName: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Focus Hours",
      value: formatFocusTime(data.summary.totalFocusMinutes),
      trend: `${data.summary.averageSessionLength}m avg`,
      icon: Clock,
      iconClassName: "bg-sky-50 text-sky-600",
    },
  ];
  const focusCards = [
    {
      label: "Today XP",
      value: formatNumber(data.summary.todayXp),
      helper: "StudySession points created today",
      icon: Sparkles,
      iconClassName: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Best Focus Hour",
      value: data.summary.bestFocusHour ?? "No data",
      helper: "Based on tracked focus minutes",
      icon: Brain,
      iconClassName: "bg-green-50 text-green-700",
    },
    {
      label: "Avg. Focus Session",
      value:
        data.summary.averageSessionLength > 0
          ? `${data.summary.averageSessionLength} min`
          : "No data",
      helper: "Only sessions with duration are counted",
      icon: Clock,
      iconClassName: "bg-sky-50 text-sky-600",
    },
  ];
  const planCompletionRate = data.resources.studyPlans.completionRate ?? 0;

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-[#0f172a]">
          Performance Overview
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#64748b]">
          Real metrics from your XP sessions, plans, flashcards, quizzes, and AI
          conversations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconClassName}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {card.trend}
                </div>
              </div>
              <p className="mt-5 text-sm font-medium text-[#64748b]">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[#0f172a]">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm md:min-h-[500px] md:p-6">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#0f172a]">
                XP Growth
              </h3>
              <p className="mt-1 text-sm text-[#64748b]">
                {activeChartRange.description}
              </p>
            </div>
            <div className="relative inline-grid grid-cols-2 rounded-full border border-[#e2e8f0] bg-white/90 p-0.5 shadow-sm shadow-slate-200/60">
              <span
                className={`absolute left-0.5 top-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-full bg-[#0a9f43] shadow-sm shadow-emerald-200 transition-transform duration-300 ease-out ${
                  chartRange === "monthly" ? "translate-x-full" : "translate-x-0"
                }`}
                aria-hidden="true"
              />
              {(Object.keys(chartRanges) as ChartRange[]).map((range) => {
                const isActive = chartRange === range;

                return (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setChartRange(range)}
                    className={`relative z-10 min-w-20 cursor-pointer rounded-full px-3 py-1 text-[8px] font-semibold transition-colors duration-300 ${
                      isActive
                        ? "text-white"
                        : "text-[#64748b] hover:text-[#0f172a]"
                    }`}
                    aria-pressed={isActive}
                  >
                    {chartRanges[range].label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[250px] min-h-[250px] w-full min-w-0 overflow-hidden md:h-[350px] md:min-h-[350px]">
            {data.hasActivity ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activeChartRange.data}
                  margin={{ top: 12, right: 18, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="xpAreaGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#0a9f43" stopOpacity={0.8} />
                      <stop offset="55%" stopColor="#4ade80" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#0a9f43" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    dy={10}
                    interval={chartRange === "monthly" ? 3 : 0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    width={42}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "#0a9f43", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="xp"
                    stroke="#0a9f43"
                    strokeWidth={3}
                    fill="url(#xpAreaGradient)"
                    activeDot={{
                      r: 7,
                      stroke: "#ffffff",
                      strokeWidth: 3,
                      fill: "#0a9f43",
                    }}
                    animationDuration={900}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState />
            )}
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm md:min-h-[500px] md:p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold tracking-tight text-[#0f172a]">
              XP Distribution
            </h3>
            <p className="mt-1 text-sm text-[#64748b]">
              XP grouped by actual StudySession action type.
            </p>
          </div>

          {data.charts.activityDistribution.length > 0 ? (
            <>
              <div className="h-[250px] min-h-[250px] w-full min-w-0 overflow-hidden md:h-[350px] md:min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.charts.activityDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={94}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {data.charts.activityDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${formatNumber(Number(value))} XP`, "XP"]}
                      contentStyle={{
                        borderRadius: 12,
                        borderColor: "#e2e8f0",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 space-y-3">
                {data.charts.activityDistribution.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-2 text-[#64748b]">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </div>
                    <span className="font-medium text-[#0f172a]">
                      {formatNumber(item.value)} XP
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[250px] items-center justify-center rounded-xl bg-[#f8fafc] text-center text-sm text-[#64748b] md:h-[350px]">
              No XP sessions yet.
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {focusCards.map((item) => {
          const Icon = item.icon;

          return (
            <section
              key={item.label}
              className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClassName}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-5 text-sm font-medium text-[#64748b]">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[#0f172a]">
                {item.value}
              </p>
              <p className="mt-2 text-sm text-[#475569]">{item.helper}</p>
            </section>
          );
        })}
      </div>

      <RecentActivityTimeline activities={data.recentActivity ?? []} />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold tracking-tight text-[#0f172a]">
              Learning Resources
            </h3>
            <p className="mt-1 text-sm text-[#64748b]">
              Counts from StudyPlan, FlashcardDeck, Flashcard, Quiz, and
              Conversation records.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                <BookOpen className="h-4 w-4 text-[#0a9f43]" />
                Study Plans
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-[#0f172a]">
                {formatNumber(data.resources.studyPlans.total)}
              </p>
              <p className="mt-1 text-sm text-[#64748b]">
                {data.resources.studyPlans.completed} completed,{" "}
                {data.resources.studyPlans.active} active
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#0a9f43]"
                  style={{ width: `${planCompletionRate}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-semibold text-[#0a9f43]">
                {data.resources.studyPlans.completionRate === null
                  ? "No plans yet"
                  : `${planCompletionRate}% completed`}
              </p>
            </div>

            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                <Layers className="h-4 w-4 text-[#14b8a6]" />
                Flashcards
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-[#0f172a]">
                {formatNumber(data.resources.flashcards.cards)}
              </p>
              <p className="mt-1 text-sm text-[#64748b]">
                Cards across {formatNumber(data.resources.flashcards.decks)} decks
              </p>
            </div>

            <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                <CheckCircle2 className="h-4 w-4 text-[#f43f5e]" />
                Quizzes
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-[#0f172a]">
                {formatNumber(data.resources.quizzes.completed)}
              </p>
              <p className="mt-1 text-sm text-[#64748b]">
                Completed out of {formatNumber(data.resources.quizzes.total)}
              </p>
              <p className="mt-4 text-sm font-semibold text-[#0f172a]">
                Avg. score:{" "}
                {data.resources.quizzes.averageScore === null
                  ? "No score data"
                  : `${data.resources.quizzes.averageScore}%`}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ecfdf3] text-[#0a9f43]">
            <MessageCircle className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-[#0f172a]">
            AI Assistant Usage
          </h3>
          <p className="mt-1 text-sm text-[#64748b]">
            Conversation count is available in the database; message-level
            performance scoring is already reflected in XP sessions.
          </p>
          <div className="mt-6 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-5">
            <p className="text-sm font-medium text-[#64748b]">Conversations</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight text-[#0f172a]">
              {formatNumber(data.resources.aiConversations)}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
