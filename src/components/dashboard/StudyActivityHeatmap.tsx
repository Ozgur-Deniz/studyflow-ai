"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type IntensityLevel = "none" | "low" | "moderate" | "high" | "very-high";

type ContributionDay = {
  date: Date;
  dateKey: string;
  count: number;
  isInRange: boolean;
};

type ContributionGridData = {
  weeks: ContributionDay[][];
  gridStartDate: Date;
};

export type HeatmapDataPoint = {
  date: string;
  count: number;
};

type MonthLabel = {
  label: string;
  weekIndex: number;
  weekSpan: number;
  startsOnGridBoundary: boolean;
};

type StudyStat = {
  label: string;
  value: string;
};

type LevelDistributionItem = {
  level: IntensityLevel;
  label: string;
  count: number;
  percentage: number;
  color: string;
};

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const LEGEND_LEVELS: IntensityLevel[] = [
  "none",
  "low",
  "moderate",
  "high",
  "very-high",
];
const CELL_SIZE = 11;
const CELL_GAP = 3;
const DAY_LABEL_WIDTH = 28;
const LEVEL_REVEAL_DELAYS: Record<IntensityLevel, number> = {
  none: 0,
  low: 300,
  moderate: 600,
  high: 900,
  "very-high": 1200,
};
const DONUT_REVEAL_DELAY = 1900;
const DONUT_SEGMENT_REVEAL_STEP = 130;
const LEVEL_LIST_REVEAL_DELAY = 3500;
const LEVEL_LIST_REVEAL_STEP = 110;
const STAT_CARD_REVEAL_DELAY = 4550;
const STAT_CARD_REVEAL_STEP = 120;
const LEVEL_LABELS: Record<IntensityLevel, string> = {
  none: "None",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  "very-high": "Very High",
};
const LEVEL_POINT_RANGES: Record<IntensityLevel, string> = {
  none: "0 XP",
  low: "1-24 XP",
  moderate: "25-49 XP",
  high: "50-99 XP",
  "very-high": "100+ XP",
};
const LEVEL_DONUT_COLORS: Record<IntensityLevel, string> = {
  none: "#e2e8f0",
  low: "#d1fae5",
  moderate: "#6ee7b7",
  high: "#10b981",
  "very-high": "#047857",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function getSundayFirstDayIndex(date: Date): number {
  return date.getDay();
}

function getDaysBetween(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (startOfDay(endDate).getTime() - startOfDay(startDate).getTime()) /
      millisecondsPerDay,
  );
}

function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatDateLabel(date: Date): string {
  return getDateKey(date);
}

export function getDateRange(referenceDate: Date): {
  startDate: Date;
  endDate: Date;
} {
  const endDate = startOfDay(referenceDate);
  const startDate = addDays(endDate, -364);

  return {
    startDate,
    endDate,
  };
}

export function buildContributionGrid(
  startDate: Date,
  endDate: Date,
  contributionData: Record<string, number>,
): ContributionGridData {
  const normalizedStartDate = startOfDay(startDate);
  const normalizedEndDate = startOfDay(endDate);
  const gridStartDate = addDays(
    normalizedStartDate,
    -getSundayFirstDayIndex(normalizedStartDate),
  );
  const gridEndDate = addDays(
    normalizedEndDate,
    6 - getSundayFirstDayIndex(normalizedEndDate),
  );
  const totalGridDays = getDaysBetween(gridStartDate, gridEndDate) + 1;
  const weeks: ContributionDay[][] = [];

  for (let dayOffset = 0; dayOffset < totalGridDays; dayOffset += 1) {
    const date = addDays(gridStartDate, dayOffset);
    const weekIndex = Math.floor(dayOffset / 7);
    const dateKey = getDateKey(date);
    const isInRange = date >= normalizedStartDate && date <= normalizedEndDate;
    const contribution = contributionData[dateKey];
    const week = weeks[weekIndex] ?? [];

    week.push({
      date,
      dateKey,
      count: isInRange ? contribution ?? 0 : 0,
      isInRange,
    });
    weeks[weekIndex] = week;
  }

  return {
    weeks,
    gridStartDate,
  };
}

export function getMonthLabels(
  startDate: Date,
  endDate: Date,
  gridStartDate: Date,
): MonthLabel[] {
  const labels: MonthLabel[] = [];
  const normalizedStartDate = startOfDay(startDate);
  const normalizedEndDate = startOfDay(endDate);
  let cursor = new Date(
    normalizedStartDate.getFullYear(),
    normalizedStartDate.getMonth(),
    1,
  );

  while (cursor <= normalizedEndDate) {
    const monthStartDate = startOfDay(cursor);
    const monthEndDate = startOfDay(
      new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
    );
    const visibleMonthStart =
      monthStartDate < normalizedStartDate
        ? normalizedStartDate
        : monthStartDate;
    const visibleMonthEnd =
      monthEndDate > normalizedEndDate ? normalizedEndDate : monthEndDate;

    if (visibleMonthStart <= visibleMonthEnd) {
      const weekIndex = Math.floor(
        getDaysBetween(gridStartDate, visibleMonthStart) / 7,
      );
      const endWeekIndex = Math.floor(
        getDaysBetween(gridStartDate, visibleMonthEnd) / 7,
      );
      const monthLabel = MONTH_LABELS[monthStartDate.getMonth()];

      labels.push({
        label: monthLabel,
        weekIndex,
        weekSpan: Math.max(1, endWeekIndex - weekIndex + 1),
        startsOnGridBoundary: visibleMonthStart.getDay() === 0,
      });
    }

    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return labels;
}

export function getIntensityLevel(count: number): IntensityLevel {
  if (count === 0) {
    return "none";
  }

  if (count <= 24) {
    return "low";
  }

  if (count <= 49) {
    return "moderate";
  }

  if (count <= 99) {
    return "high";
  }

  return "very-high";
}

export function getIntensityClass(level: IntensityLevel): string {
  const classes: Record<IntensityLevel, string> = {
    none: "border-slate-200 bg-slate-100",
    low: "border-emerald-100 bg-emerald-100",
    moderate: "border-emerald-200 bg-emerald-300",
    high: "border-emerald-500 bg-emerald-500",
    "very-high": "border-emerald-700 bg-emerald-700",
  };

  return classes[level];
}

function getRealContributionDays(grid: ContributionGridData): ContributionDay[] {
  return grid.weeks.flat().filter((day) => day.isInRange);
}

function getLongestStreak(days: ContributionDay[]): number {
  let currentStreak = 0;
  let longestStreak = 0;

  days.forEach((day) => {
    if (day.count > 0) {
      currentStreak += 1;
      longestStreak = Math.max(longestStreak, currentStreak);
      return;
    }

    currentStreak = 0;
  });

  return longestStreak;
}

function getMostActiveDay(days: ContributionDay[]): string {
  const mostActiveDay = days.reduce<ContributionDay | null>((currentMost, day) => {
    if (!currentMost || day.count > currentMost.count) {
      return day;
    }

    return currentMost;
  }, null);

  if (!mostActiveDay || mostActiveDay.count === 0) {
    return "No activity";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(mostActiveDay.date);
}

function calculateStats(days: ContributionDay[]): StudyStat[] {
  const totalPoints = days.reduce((total, day) => total + day.count, 0);
  const activeDays = days.filter((day) => day.count > 0);
  const averageDailyPoints =
    activeDays.length > 0 ? Math.round(totalPoints / activeDays.length) : 0;
  const peakDailyPoints = days.reduce(
    (highestCount, day) => Math.max(highestCount, day.count),
    0,
  );

  return [
    {
      label: "Total XP",
      value: totalPoints.toLocaleString("en-US"),
    },
    {
      label: "Active Days",
      value: activeDays.length.toLocaleString("en-US"),
    },
    {
      label: "Average Daily XP",
      value: averageDailyPoints.toLocaleString("en-US"),
    },
    {
      label: "Longest Streak",
      value: `${getLongestStreak(days)} days`,
    },
    {
      label: "Most Active Day",
      value: getMostActiveDay(days),
    },
    {
      label: "Peak Daily XP",
      value: peakDailyPoints.toLocaleString("en-US"),
    },
  ];
}

function calculateLevelDistribution(days: ContributionDay[]): LevelDistributionItem[] {
  const totalDays = days.length || 1;
  const countsByLevel = LEGEND_LEVELS.reduce(
    (totals, level) => ({
      ...totals,
      [level]: 0,
    }),
    {} as Record<IntensityLevel, number>,
  );

  days.forEach((day) => {
    const level = getIntensityLevel(day.count);
    countsByLevel[level] += 1;
  });

  return LEGEND_LEVELS.map((level) => {
    const count = countsByLevel[level];

    return {
      level,
      label: LEVEL_LABELS[level],
      count,
      percentage: Math.round((count / totalDays) * 100),
      color: LEVEL_DONUT_COLORS[level],
    };
  });
}

function StatCard({
  label,
  value,
  index,
  isVisible,
  shouldReduceMotion,
}: StudyStat & {
  index: number;
  isVisible: boolean;
  shouldReduceMotion: boolean;
}) {
  const shouldShowCard = isVisible || shouldReduceMotion;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm shadow-slate-200/45 transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        shouldShowCard ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      style={{
        transitionDelay: shouldReduceMotion
          ? "0ms"
          : `${STAT_CARD_REVEAL_DELAY + index * STAT_CARD_REVEAL_STEP}ms`,
      }}
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-[20px] font-semibold leading-none tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ActivityDonutChart({
  distribution,
  activeDays,
  isVisible,
  shouldReduceMotion,
}: {
  distribution: LevelDistributionItem[];
  activeDays: number;
  isVisible: boolean;
  shouldReduceMotion: boolean;
}) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const shouldShowDonut = isVisible || shouldReduceMotion;
  const totalDays =
    distribution.reduce((total, item) => total + item.count, 0) || 1;
  const donutSegments = distribution.reduce<
    Array<LevelDistributionItem & { dashLength: number; dashOffset: number }>
  >((segments, item) => {
    const previousCount = segments.reduce(
      (total, segment) => total + segment.count,
      0,
    );
    const segmentRatio = item.count / totalDays;
    const dashLength = segmentRatio * circumference;
    const dashOffset =
      circumference - (previousCount / totalDays) * circumference;

    return [
      ...segments,
      {
        ...item,
        dashLength,
        dashOffset,
      },
    ];
  }, []);

  return (
    <div className="relative mx-auto h-[160px] w-[160px] shrink-0">
      <svg
        viewBox="0 0 160 160"
        className="h-full w-full -rotate-90"
        role="img"
        aria-label="Activity level distribution"
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="18"
          className="transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            opacity: shouldShowDonut ? 1 : 0,
            transitionDelay: shouldReduceMotion
              ? "0ms"
              : `${DONUT_REVEAL_DELAY}ms`,
          }}
        />
        {donutSegments.map((item, index) => {
          return (
            <circle
              key={item.level}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth="18"
              strokeDasharray={
                shouldShowDonut
                  ? `${item.dashLength} ${circumference - item.dashLength}`
                  : `0 ${circumference}`
              }
              strokeDashoffset={item.dashOffset}
              strokeLinecap="butt"
              className="transition-[stroke-dasharray,opacity] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                opacity: shouldShowDonut ? 1 : 0,
                transitionDelay: shouldReduceMotion
                  ? "0ms"
                  : `${
                      DONUT_REVEAL_DELAY + index * DONUT_SEGMENT_REVEAL_STEP
                    }ms`,
              }}
            />
          );
        })}
      </svg>

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          shouldShowDonut ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        style={{
          transitionDelay: shouldReduceMotion
            ? "0ms"
            : `${DONUT_REVEAL_DELAY + 420}ms`,
        }}
      >
        <span className="text-[31px] font-semibold leading-none text-slate-950">
          {activeDays}
        </span>
        <span className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
          Active Days
        </span>
      </div>
    </div>
  );
}

function LevelDistribution({
  distribution,
  isVisible,
  shouldReduceMotion,
}: {
  distribution: LevelDistributionItem[];
  isVisible: boolean;
  shouldReduceMotion: boolean;
}) {
  const shouldShowLevels = isVisible || shouldReduceMotion;

  return (
    <div className="min-w-0 flex-1 space-y-2.5">
      <p
        className={`text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400 transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          shouldShowLevels
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0"
        }`}
        style={{
          transitionDelay: shouldReduceMotion
            ? "0ms"
            : `${LEVEL_LIST_REVEAL_DELAY - LEVEL_LIST_REVEAL_STEP}ms`,
        }}
      >
        Activity Levels
      </p>
      {distribution.map((item, index) => (
        <div
          key={item.level}
          className={`flex items-center justify-between gap-3 transition-[opacity,transform] duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            shouldShowLevels
              ? "translate-y-0 opacity-100"
              : "translate-y-2 opacity-0"
          }`}
          style={{
            transitionDelay: shouldReduceMotion
              ? "0ms"
              : `${LEVEL_LIST_REVEAL_DELAY + index * LEVEL_LIST_REVEAL_STEP}ms`,
          }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            <span className="truncate text-[12px] font-medium text-slate-600">
              {item.label}
            </span>
          </div>
          <span className="text-[12px] font-medium text-slate-900">
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

function ActivityLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-slate-500">
      <span className="shrink-0">Less</span>
      <div className="flex flex-wrap items-center gap-2">
        {LEGEND_LEVELS.map((level) => {
          const label = `${LEVEL_LABELS[level]}: ${LEVEL_POINT_RANGES[level]}`;

          return (
            <span key={level} className="flex items-center gap-1.5" title={label}>
              <span
                className={`rounded-sm border ${getIntensityClass(level)}`}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                }}
                aria-hidden="true"
              />
              <span>{LEVEL_POINT_RANGES[level]}</span>
            </span>
          );
        })}
      </div>
      <span className="shrink-0">More</span>
    </div>
  );
}

function ActivityScoringGuide() {
  const scoringRules = [
    {
      action: "Pomodoro focus",
      points: "25 XP",
      detail: "Daily limit: 200 XP.",
    },
    {
      action: "Quiz completed",
      points: "10 + 4/correct",
      detail: "Daily limit: 120 XP.",
    },
    {
      action: "Flashcards",
      points: "1/card + 10/deck",
      detail: "Daily limits: 60 review XP, 30 deck XP.",
    },
    {
      action: "Study plan",
      points: "5 created, 40 done",
      detail: "Daily limits: 15 created XP, 80 done XP.",
    },
    {
      action: "AI assistant",
      points: "1/message, 5/resource",
      detail: "Daily limits: 10 message XP, 20 resource XP.",
    },
  ];

  return (
    <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-[12px] leading-5 text-slate-500">
      <p>
        XP is calculated from database records: each heatmap day shows the sum
        of <span className="font-medium text-slate-700">StudySession.points</span>{" "}
        created on that date. Break timers do not add XP.
      </p>
      <div className="grid gap-x-5 gap-y-1 sm:grid-cols-[max-content_max-content_minmax(0,1fr)]">
        {scoringRules.map((item) => (
          <div key={item.action} className="contents">
            <span className="font-medium text-slate-700">{item.action}</span>
            <span className="font-medium text-emerald-700">{item.points}</span>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContributionGrid({
  grid,
  monthLabels,
  weekColumnTemplate,
  isVisible,
  shouldReduceMotion,
}: {
  grid: ContributionGridData;
  monthLabels: MonthLabel[];
  weekColumnTemplate: string;
  isVisible: boolean;
  shouldReduceMotion: boolean;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm shadow-slate-200/35 sm:p-5">
      <div className="flex min-h-[150px] flex-1 items-center overflow-x-auto overflow-y-hidden pb-1 lg:overflow-hidden">
        <div
          className="min-w-max flex-1 lg:min-w-0"
        >
          <div
            className="mb-1 grid"
            style={{
              gridTemplateColumns: `${DAY_LABEL_WIDTH}px ${weekColumnTemplate}`,
            }}
          >
            <div aria-hidden="true" />
            <div
              className="grid h-5 overflow-visible"
              style={{
                gridTemplateColumns: weekColumnTemplate,
                columnGap: CELL_GAP,
              }}
            >
              {monthLabels.map((month) => (
                <span
                  key={`${month.label}-${month.weekIndex}`}
                  className="whitespace-nowrap pl-0.5 text-xs font-medium leading-none text-slate-500"
                  style={{
                    gridColumn: `${month.weekIndex + 1} / span ${month.weekSpan}`,
                    gridRow: 1,
                    justifySelf: "start",
                    alignSelf: "end",
                  }}
                >
                  {month.label}
                </span>
              ))}
            </div>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `${DAY_LABEL_WIDTH}px ${weekColumnTemplate}`,
            }}
          >
            <div
              className="grid"
              style={{
                rowGap: CELL_GAP,
              }}
            >
              {DAY_LABELS.map((label, index) => (
                <div
                  key={`${label}-${index}`}
                  className="flex items-center text-[10px] font-medium leading-none text-slate-400"
                  style={{
                    height: CELL_SIZE,
                  }}
                >
                  {label}
                </div>
              ))}
            </div>

            <div
              className="grid"
              style={{
                gridTemplateColumns: weekColumnTemplate,
                gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                columnGap: CELL_GAP,
                rowGap: CELL_GAP,
              }}
            >
              {monthLabels
                .slice(1)
                .filter((month) => month.startsOnGridBoundary)
                .map((month) => (
                  <div
                    key={`${month.label}-${month.weekIndex}-divider`}
                    className="pointer-events-none z-0 -ml-1 border-l border-slate-200/80"
                    style={{
                      gridColumn: month.weekIndex + 1,
                      gridRow: "1 / span 7",
                    }}
                    aria-hidden="true"
                  />
                ))}
              {grid.weeks.map((week, weekIndex) =>
                week.map((day, dayIndex) => {
                  const level = getIntensityLevel(day.count);

                  return (
                    <div
                      key={day.dateKey}
                      className="z-10 flex items-center justify-center"
                      style={{
                        gridColumn: weekIndex + 1,
                        gridRow: dayIndex + 1,
                      }}
                    >
                      {day.isInRange ? (
                        <div
                          className={`h-[11px] w-[11px] rounded-full border transition-[opacity,transform] duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-125 hover:ring-2 hover:ring-emerald-200 ${getIntensityClass(
                            level,
                          )} ${
                            isVisible || shouldReduceMotion
                              ? "opacity-100 translate-y-0 scale-100"
                              : "opacity-0 translate-y-1 scale-[0.85]"
                          }`}
                          style={{
                            transitionDelay: shouldReduceMotion
                              ? "0ms"
                              : `${
                                  LEVEL_REVEAL_DELAYS[level] +
                                  Math.min((weekIndex + dayIndex) * 3, 60)
                                }ms`,
                          }}
                          title={`${formatDateLabel(day.date)}: ${day.count} XP`}
                          aria-label={`${formatDateLabel(day.date)}: ${day.count} XP`}
                        />
                      ) : (
                        <div className="h-[11px] w-[11px]" aria-hidden="true" />
                      )}
                    </div>
                  );
                }),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] font-medium text-slate-500">
          Learn how we count study activity and XP
        </p>
        <ActivityLegend />
      </div>
      <ActivityScoringGuide />
    </div>
  );
}

export function StudyActivityHeatmap({
  data,
  animationReady = true,
}: {
  data: HeatmapDataPoint[];
  animationReady?: boolean;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const isVisible =
    shouldReduceMotion || (animationReady && hasEnteredViewport);
  const dateRange = useMemo(() => getDateRange(today), [today]);
  const contributionData = useMemo(() => {
    return data.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.date] = item.count;

      return accumulator;
    }, {});
  }, [data]);
  const grid = useMemo(
    () =>
      buildContributionGrid(
        dateRange.startDate,
        dateRange.endDate,
        contributionData,
      ),
    [contributionData, dateRange],
  );
  const monthLabels = useMemo(
    () =>
      getMonthLabels(
        dateRange.startDate,
        dateRange.endDate,
        grid.gridStartDate,
      ),
    [dateRange, grid.gridStartDate],
  );
  const realContributionDays = useMemo(() => getRealContributionDays(grid), [grid]);
  const stats = useMemo(
    () => calculateStats(realContributionDays),
    [realContributionDays],
  );
  const levelDistribution = useMemo(
    () => calculateLevelDistribution(realContributionDays),
    [realContributionDays],
  );
  const activeDays = useMemo(
    () => realContributionDays.filter((day) => day.count > 0).length,
    [realContributionDays],
  );
  const weekColumnTemplate = `repeat(${grid.weeks.length}, minmax(${CELL_SIZE}px, 1fr))`;

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncMotionPreference = () => {
      setShouldReduceMotion(motionQuery.matches);

      if (motionQuery.matches) {
        setHasEnteredViewport(true);
      }
    };

    syncMotionPreference();
    motionQuery.addEventListener("change", syncMotionPreference);

    return () => {
      motionQuery.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  useEffect(() => {
    if (hasEnteredViewport || shouldReduceMotion) {
      return;
    }

    const sectionElement = sectionRef.current;

    if (!sectionElement || !("IntersectionObserver" in window)) {
      setHasEnteredViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setHasEnteredViewport(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.18,
      },
    );

    observer.observe(sectionElement);

    return () => {
      observer.disconnect();
    };
  }, [hasEnteredViewport, shouldReduceMotion]);

  return (
    <section
      ref={sectionRef}
      className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-6"
    >
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[22px] font-semibold tracking-tight text-slate-950">
            Study Activity
          </h2>
          <p className="mt-1 text-[13px] font-medium text-slate-500">
            Your learning journey at a glance.
          </p>
        </div>

        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <ContributionGrid
            grid={grid}
            monthLabels={monthLabels}
            weekColumnTemplate={weekColumnTemplate}
            isVisible={isVisible}
            shouldReduceMotion={shouldReduceMotion}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/45">
            <div className="flex h-full flex-col justify-center gap-5 sm:flex-row sm:items-center xl:flex-col xl:items-stretch">
              <ActivityDonutChart
                distribution={levelDistribution}
                activeDays={activeDays}
                isVisible={isVisible}
                shouldReduceMotion={shouldReduceMotion}
              />
              <LevelDistribution
                distribution={levelDistribution}
                isVisible={isVisible}
                shouldReduceMotion={shouldReduceMotion}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              index={index}
              isVisible={isVisible}
              shouldReduceMotion={shouldReduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
