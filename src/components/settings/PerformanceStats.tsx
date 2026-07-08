"use client";

import { useState } from "react";
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
  ArrowUpRight,
  Clock,
  Flame,
  Layers,
  Sparkles,
} from "lucide-react";

interface XpDataPoint {
  label: string;
  xp: number;
  focusMinutes: number;
}

interface ActivityDataPoint {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    value?: number;
    payload?: XpDataPoint;
  }>;
}

const xpData: XpDataPoint[] = [
  { label: "Mon", xp: 120, focusMinutes: 45 },
  { label: "Tue", xp: 300, focusMinutes: 95 },
  { label: "Wed", xp: 180, focusMinutes: 60 },
  { label: "Thu", xp: 420, focusMinutes: 130 },
  { label: "Fri", xp: 360, focusMinutes: 105 },
  { label: "Sat", xp: 510, focusMinutes: 155 },
  { label: "Sun", xp: 440, focusMinutes: 125 },
];

const monthlyXpData: XpDataPoint[] = [
  { label: "Week 1", xp: 860, focusMinutes: 280 },
  { label: "Week 2", xp: 1240, focusMinutes: 390 },
  { label: "Week 3", xp: 1580, focusMinutes: 475 },
  { label: "Week 4", xp: 1860, focusMinutes: 540 },
];

const chartRanges = {
  weekly: {
    label: "Weekly",
    description: "Last 7 days of study activity.",
    data: xpData,
  },
  monthly: {
    label: "Monthly",
    description: "Last 4 weeks of study activity.",
    data: monthlyXpData,
  },
} as const;

type ChartRange = keyof typeof chartRanges;

const activityData: ActivityDataPoint[] = [
  { name: "Study Plans", value: 34, color: "#6366f1" },
  { name: "Flashcards", value: 28, color: "#14b8a6" },
  { name: "Quizzes", value: 24, color: "#f43f5e" },
  { name: "AI Assistant", value: 14, color: "#f59e0b" },
];

const statCards = [
  {
    label: "Total XP",
    value: "2,330",
    trend: "+12%",
    icon: Sparkles,
    iconClassName: "bg-indigo-50 text-indigo-600",
  },
  {
    label: "Current Streak",
    value: "9 days",
    trend: "+3 days",
    icon: Flame,
    iconClassName: "bg-orange-50 text-orange-600",
  },
  {
    label: "Materials Created",
    value: "42",
    trend: "+18%",
    icon: Layers,
    iconClassName: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "Focus Hours",
    value: "18.4h",
    trend: "+8%",
    icon: Clock,
    iconClassName: "bg-sky-50 text-sky-600",
  },
];

const CustomTooltip = ({ active, label, payload }: CustomTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;
  const focusMinutes = point?.focusMinutes ?? 0;
  const focusHours = Math.floor(focusMinutes / 60);
  const remainingMinutes = focusMinutes % 60;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/95 px-4 py-3 text-white shadow-2xl shadow-slate-900/20 backdrop-blur-xl">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-base font-semibold">{payload[0].value ?? 0} XP</p>
      <p className="mt-1 text-xs text-slate-300">
        Focus time:{" "}
        {focusHours > 0 ? `${focusHours}h ${remainingMinutes}m` : `${remainingMinutes}m`}
      </p>
    </div>
  );
};

export function PerformanceStats() {
  const [chartRange, setChartRange] = useState<ChartRange>("weekly");
  const activeChartRange = chartRanges[chartRange];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-[#0f172a]">
          Performance Overview
        </h2>
        <p className="mt-1 text-sm leading-6 text-[#64748b]">
          Track your XP growth, focus consistency, and study activity mix.
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

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
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
                className={`absolute left-0.5 top-0.5 h-[calc(100%-4px)] w-[calc(50%-2px)] rounded-full bg-[#6366f1] shadow-sm shadow-indigo-200 transition-transform duration-300 ease-out ${
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

          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activeChartRange.data}
                margin={{ top: 12, right: 18, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="xpAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="55%" stopColor="#8b5cf6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
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
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  width={42}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#6366f1", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fill="url(#xpAreaGradient)"
                  activeDot={{
                    r: 7,
                    stroke: "#ffffff",
                    strokeWidth: 3,
                    fill: "#6366f1",
                  }}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold tracking-tight text-[#0f172a]">
              Activity Distribution
            </h3>
            <p className="mt-1 text-sm text-[#64748b]">
              Where your study effort goes.
            </p>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activityData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={94}
                  paddingAngle={4}
                  stroke="none"
                >
                  {activityData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-3">
            {activityData.map((item) => (
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
                <span className="font-medium text-[#0f172a]">{item.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
