import { NextRequest, NextResponse } from "next/server";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NOTIFICATION_ACTIONS = [
  "POMODORO_FOCUS",
  "QUIZ_COMPLETED",
  "FLASHCARD_REVIEWED",
  "FLASHCARD_DECK_COMPLETED",
  "STUDY_PLAN_COMPLETED",
  "AI_MESSAGE_SENT",
] as const;

type NotificationAction = (typeof NOTIFICATION_ACTIONS)[number];

const ACTION_META: Record<
  NotificationAction,
  { title: string; href: string }
> = {
  POMODORO_FOCUS: {
    title: "Focus session completed",
    href: "/focus-zone",
  },
  QUIZ_COMPLETED: { title: "Quiz completed", href: "/quizzes" },
  FLASHCARD_REVIEWED: {
    title: "Flashcard reviewed",
    href: "/flashcards",
  },
  FLASHCARD_DECK_COMPLETED: {
    title: "Flashcard deck completed",
    href: "/flashcards",
  },
  STUDY_PLAN_COMPLETED: {
    title: "Study plan completed",
    href: "/study-plans",
  },
  AI_MESSAGE_SENT: {
    title: "AI study session updated",
    href: "/ai-assistant",
  },
};

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const [sessions, studyPlans, flashcardDecks, quizzes] = await Promise.all([
      prisma.studySession.findMany({
        where: {
          userId,
          actionType: { in: [...NOTIFICATION_ACTIONS] },
        },
        select: {
          id: true,
          actionType: true,
          points: true,
          durationMinutes: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.studyPlan.findMany({
        where: { userId },
        select: { id: true, title: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.flashcardDeck.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: { select: { flashcards: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.quiz.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: { select: { questions: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const activityNotifications = sessions.map((session) => {
      const action = session.actionType as NotificationAction;
      const meta = ACTION_META[action];
      const focusDetail =
        action === "POMODORO_FOCUS" && session.durationMinutes > 0
          ? `${session.durationMinutes} min focus - +${session.points} XP`
          : `+${session.points} XP added to your activity`;

      return {
        id: `activity-${session.id}`,
        kind: "activity" as const,
        title: meta.title,
        detail: focusDetail,
        href: meta.href,
        createdAt: session.createdAt.toISOString(),
      };
    });

    const creationNotifications = [
      ...studyPlans.map((plan) => ({
        id: `study-plan-${plan.id}`,
        kind: "study-plan" as const,
        title: "Study plan created",
        detail: plan.title,
        href: `/study-plans/${encodeURIComponent(plan.id)}`,
        createdAt: plan.createdAt.toISOString(),
      })),
      ...flashcardDecks.map((deck) => ({
        id: `flashcard-${deck.id}`,
        kind: "flashcard" as const,
        title: "Flashcards created",
        detail: `${deck.title} - ${deck._count.flashcards} cards`,
        href: `/flashcards?deck=${encodeURIComponent(deck.id)}`,
        createdAt: deck.createdAt.toISOString(),
      })),
      ...quizzes.map((quiz) => ({
        id: `quiz-${quiz.id}`,
        kind: "quiz" as const,
        title: "Quiz created",
        detail: `${quiz.title} - ${quiz._count.questions} questions`,
        href: `/quizzes?quiz=${encodeURIComponent(quiz.id)}`,
        createdAt: quiz.createdAt.toISOString(),
      })),
    ];

    const notifications = [
      ...creationNotifications,
      ...activityNotifications,
    ].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() -
        new Date(left.createdAt).getTime(),
    );

    return NextResponse.json(
      { notifications },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Dashboard Notifications API] Fetch failed:", error);
    return NextResponse.json(
      { message: "Notifications could not be loaded." },
      { status: 500 },
    );
  }
}
