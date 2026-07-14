import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, AuthError } from "@/lib/auth";
import { calculateHeatmapStats } from "@/lib/utils/statistics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    // Fetch all stats in parallel for performance
    const [
      activePlansCount,
      conversationsCount,
      sessionsAggr,
      sessions,
      flashcardDecksCount,
      quizzesCount,
    ] = await Promise.all([
        prisma.studyPlan.count({
          where: { userId, isCompleted: false },
        }),
        prisma.conversation.count({
          where: { userId },
        }),
        prisma.studySession.aggregate({
          _sum: { durationMinutes: true },
          where: { userId },
        }),
        prisma.studySession.findMany({
          where: { userId },
          select: {
            createdAt: true,
            points: true,
          },
        }),
        prisma.flashcardDeck.count({
          where: { userId },
        }),
        prisma.quiz.count({
          where: { userId },
        }),
      ]);

    const totalStudyMinutes = sessionsAggr._sum.durationMinutes || 0;
    const totalStudyHours = Math.round((totalStudyMinutes / 60) * 10) / 10;
    const pointsByDate = new Map<string, number>();

    sessions.forEach((session) => {
      const dateKey = formatDateKey(session.createdAt);

      pointsByDate.set(dateKey, (pointsByDate.get(dateKey) ?? 0) + session.points);
    });

    const heatmapStats = calculateHeatmapStats(
      Array.from(pointsByDate.entries()).map(([date, count]) => ({
        date,
        count,
      })),
      formatDateKey(new Date()),
    );

    const statsData = {
      activeStudyPlans: activePlansCount,
      aiConversations: conversationsCount,
      totalStudyHours: totalStudyHours,
      currentStreak: heatmapStats.currentStreak,
      flashcardDecks: flashcardDecksCount,
      quizzesSolved: quizzesCount,
    };

    console.log(
      `[Dashboard Stats API] Stats successfully retrieved for user: ${userId}`,
    );
    return NextResponse.json(
      { stats: statsData },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("[Dashboard Stats API] Internal server error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching dashboard statistics." },
      { status: 500 },
    );
  }
}
