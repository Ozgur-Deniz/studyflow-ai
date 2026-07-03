import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    // Fetch all stats in parallel for performance
    const [activePlansCount, conversationsCount, sessionsAggr, flashcardDecksCount, quizzesCount] =
      await Promise.all([
        prisma.studyPlan.count({
          where: { userId, isCompleted: false },
        }),
        prisma.conversation.count({
          where: { userId },
        }),
        prisma.studySession.aggregate({
          _sum: { duration: true },
          where: { userId },
        }),
        prisma.flashcardDeck.count({
          where: { userId },
        }),
        prisma.quiz.count({
          where: { userId },
        }),
      ]);

    const totalStudyHours = sessionsAggr._sum.duration || 0;

    const statsData = {
      activeStudyPlans: activePlansCount,
      aiConversations: conversationsCount,
      totalStudyHours: totalStudyHours,
      currentStreak: 0,
      flashcardDecks: flashcardDecksCount,
      quizzesSolved: quizzesCount,
    };

    console.log(
      `[Dashboard Stats API] Stats successfully retrieved for user: ${userId}`,
    );
    return NextResponse.json({ stats: statsData }, { status: 200 });
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
