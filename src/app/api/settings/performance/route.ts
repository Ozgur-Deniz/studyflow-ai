import { NextRequest, NextResponse } from "next/server";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateHeatmapStats } from "@/lib/utils/statistics";

type RangePoint = {
  label: string;
  dateKey: string;
  xp: number;
  focusMinutes: number;
};

type ActivityCategory =
  | "Pomodoro Focus"
  | "Quizzes"
  | "Flashcards"
  | "Study Plans"
  | "AI Assistant"
  | "Other";

const ACTIVITY_COLORS: Record<ActivityCategory, string> = {
  "Pomodoro Focus": "#6366f1",
  Quizzes: "#f43f5e",
  Flashcards: "#14b8a6",
  "Study Plans": "#f59e0b",
  "AI Assistant": "#8b5cf6",
  Other: "#64748b",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatWeekday(date: Date): string {
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(date);
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getActivityCategory(actionType: string): ActivityCategory {
  if (actionType === "POMODORO_FOCUS") {
    return "Pomodoro Focus";
  }

  if (actionType === "QUIZ_COMPLETED") {
    return "Quizzes";
  }

  if (
    actionType === "FLASHCARD_REVIEWED" ||
    actionType === "FLASHCARD_DECK_COMPLETED"
  ) {
    return "Flashcards";
  }

  if (
    actionType === "STUDY_PLAN_CREATED" ||
    actionType === "STUDY_PLAN_COMPLETED"
  ) {
    return "Study Plans";
  }

  if (actionType === "AI_MESSAGE_SENT" || actionType === "AI_RESOURCE_GENERATED") {
    return "AI Assistant";
  }

  return "Other";
}

function buildRangeData({
  startDate,
  days,
  pointsByDate,
  focusMinutesByDate,
  labelFormatter,
}: {
  startDate: Date;
  days: number;
  pointsByDate: Map<string, number>;
  focusMinutesByDate: Map<string, number>;
  labelFormatter: (date: Date) => string;
}): RangePoint[] {
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(startDate, index);
    const dateKey = formatDateKey(date);

    return {
      label: labelFormatter(date),
      dateKey,
      xp: pointsByDate.get(dateKey) ?? 0,
      focusMinutes: focusMinutesByDate.get(dateKey) ?? 0,
    };
  });
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const today = startOfDay(new Date());
    const weeklyStart = addDays(today, -6);
    const monthlyStart = addDays(today, -27);

    const [
      allSessions,
      studyPlanCounts,
      flashcardDeckCount,
      flashcardCount,
      conversationCount,
      quizzes,
    ] = await Promise.all([
      prisma.studySession.findMany({
        where: { userId },
        select: {
          actionType: true,
          points: true,
          durationMinutes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.studyPlan.groupBy({
        by: ["isCompleted"],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.flashcardDeck.count({ where: { userId } }),
      prisma.flashcard.count({
        where: {
          deck: { userId },
        },
      }),
      prisma.conversation.count({ where: { userId } }),
      prisma.quiz.findMany({
        where: { userId },
        select: {
          score: true,
          isCompleted: true,
          _count: {
            select: { questions: true },
          },
        },
      }),
    ]);

    const pointsByDate = new Map<string, number>();
    const focusMinutesByDate = new Map<string, number>();
    const categoryPoints = new Map<ActivityCategory, number>();
    const focusSessions = allSessions.filter(
      (session) => session.durationMinutes > 0,
    );

    allSessions.forEach((session) => {
      const dateKey = formatDateKey(session.createdAt);
      const category = getActivityCategory(session.actionType);

      pointsByDate.set(dateKey, (pointsByDate.get(dateKey) ?? 0) + session.points);
      focusMinutesByDate.set(
        dateKey,
        (focusMinutesByDate.get(dateKey) ?? 0) + session.durationMinutes,
      );
      categoryPoints.set(category, (categoryPoints.get(category) ?? 0) + session.points);
    });

    const weeklyData = buildRangeData({
      startDate: weeklyStart,
      days: 7,
      pointsByDate,
      focusMinutesByDate,
      labelFormatter: formatWeekday,
    });
    const monthlyData = buildRangeData({
      startDate: monthlyStart,
      days: 28,
      pointsByDate,
      focusMinutesByDate,
      labelFormatter: formatShortDate,
    });
    const heatmapStats = calculateHeatmapStats(
      Array.from(pointsByDate.entries()).map(([date, count]) => ({
        date,
        count,
      })),
    );
    const todayKey = formatDateKey(today);
    const todayXp = pointsByDate.get(todayKey) ?? 0;
    const totalFocusMinutes = allSessions.reduce(
      (total, session) => total + session.durationMinutes,
      0,
    );
    const totalXp = allSessions.reduce((total, session) => total + session.points, 0);
    const activePlans = studyPlanCounts.find((item) => !item.isCompleted)?._count._all ?? 0;
    const completedPlans =
      studyPlanCounts.find((item) => item.isCompleted)?._count._all ?? 0;
    const totalPlans = activePlans + completedPlans;
    const completedQuizzes = quizzes.filter((quiz) => quiz.isCompleted);
    const scorePercentages = completedQuizzes
      .filter((quiz) => quiz.score !== null && quiz._count.questions > 0)
      .map((quiz) => ((quiz.score ?? 0) / quiz._count.questions) * 100);
    const averageQuizScore =
      scorePercentages.length > 0
        ? Math.round(
            scorePercentages.reduce((total, score) => total + score, 0) /
              scorePercentages.length,
          )
        : null;
    const planCompletionRate =
      totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 100) : null;

    const focusMinutesByHour = new Map<number, number>();

    focusSessions.forEach((session) => {
      const hour = session.createdAt.getHours();
      focusMinutesByHour.set(
        hour,
        (focusMinutesByHour.get(hour) ?? 0) + session.durationMinutes,
      );
    });

    const bestFocusHour =
      focusMinutesByHour.size > 0
        ? Array.from(focusMinutesByHour.entries()).sort((a, b) => b[1] - a[1])[0]
        : null;
    const averageSessionLength =
      focusSessions.length > 0
        ? Math.round(totalFocusMinutes / focusSessions.length)
        : 0;
    const activityDistribution = Array.from(categoryPoints.entries())
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: ACTIVITY_COLORS[name],
      }))
      .sort((a, b) => b.value - a.value);
    const weeklyXp = weeklyData.reduce((total, item) => total + item.xp, 0);
    const previousWeeklyXp = allSessions
      .filter((session) => {
        const createdAt = session.createdAt;
        return createdAt >= addDays(weeklyStart, -7) && createdAt < weeklyStart;
      })
      .reduce((total, session) => total + session.points, 0);
    const weeklyTrend =
      previousWeeklyXp > 0
        ? Math.round(((weeklyXp - previousWeeklyXp) / previousWeeklyXp) * 100)
        : weeklyXp > 0
          ? 100
          : 0;

    return NextResponse.json(
      {
        summary: {
          totalXp,
          todayXp,
          weeklyXp,
          weeklyTrend,
          currentStreak: heatmapStats.currentStreak,
          longestStreak: heatmapStats.longestStreak,
          totalFocusMinutes,
          averageSessionLength,
          bestFocusHour: bestFocusHour ? formatHourLabel(bestFocusHour[0]) : null,
          totalMaterials: totalPlans + flashcardDeckCount + quizzes.length,
        },
        charts: {
          weekly: weeklyData,
          monthly: monthlyData,
          activityDistribution,
        },
        resources: {
          studyPlans: {
            total: totalPlans,
            active: activePlans,
            completed: completedPlans,
            completionRate: planCompletionRate,
          },
          flashcards: {
            decks: flashcardDeckCount,
            cards: flashcardCount,
          },
          quizzes: {
            total: quizzes.length,
            completed: completedQuizzes.length,
            averageScore: averageQuizScore,
          },
          aiConversations: conversationCount,
        },
        hasActivity: allSessions.length > 0,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Performance API] Internal server error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching performance data." },
      { status: 500 },
    );
  }
}
