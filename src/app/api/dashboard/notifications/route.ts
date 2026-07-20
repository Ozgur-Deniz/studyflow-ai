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
  "STUDY_PLAN_CREATED",
  "STUDY_PLAN_COMPLETED",
  "AI_MESSAGE_SENT",
  "AI_RESOURCE_GENERATED",
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
  STUDY_PLAN_CREATED: {
    title: "Study plan created",
    href: "/study-plans",
  },
  STUDY_PLAN_COMPLETED: {
    title: "Study plan completed",
    href: "/study-plans",
  },
  AI_MESSAGE_SENT: {
    title: "AI study session updated",
    href: "/ai-assistant",
  },
  AI_RESOURCE_GENERATED: {
    title: "AI resource generated",
    href: "/ai-assistant",
  },
};

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const sessions = await prisma.studySession.findMany({
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
      take: 8,
    });

    const notifications = sessions.map((session) => {
      const action = session.actionType as NotificationAction;
      const meta = ACTION_META[action];
      const focusDetail =
        action === "POMODORO_FOCUS" && session.durationMinutes > 0
          ? `${session.durationMinutes} min focus - +${session.points} XP`
          : `+${session.points} XP added to your activity`;

      return {
        id: session.id,
        title: meta.title,
        detail: focusDetail,
        href: meta.href,
        createdAt: session.createdAt.toISOString(),
      };
    });

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
