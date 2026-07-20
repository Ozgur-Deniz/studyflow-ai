import { NextRequest, NextResponse } from "next/server";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;
const RESULTS_PER_TYPE = 4;

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const query = request.nextUrl.searchParams
      .get("q")
      ?.trim()
      .slice(0, MAX_QUERY_LENGTH);

    if (!query || query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ results: [] }, { status: 200 });
    }

    const [plans, decks, quizzes, conversations] = await Promise.all([
      prisma.studyPlan.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: RESULTS_PER_TYPE,
      }),
      prisma.flashcardDeck.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { sourceName: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          updatedAt: true,
          _count: { select: { flashcards: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: RESULTS_PER_TYPE,
      }),
      prisma.quiz.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { sourceName: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          updatedAt: true,
          _count: { select: { questions: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: RESULTS_PER_TYPE,
      }),
      prisma.conversation.findMany({
        where: {
          userId,
          title: { contains: query, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
        take: RESULTS_PER_TYPE,
      }),
    ]);

    const results = [
      ...plans.map((plan) => ({
        id: plan.id,
        type: "study-plan" as const,
        title: plan.title,
        detail: plan.isCompleted ? "Completed study plan" : "Active study plan",
        href: `/study-plans/${plan.id}`,
        updatedAt: plan.updatedAt.toISOString(),
      })),
      ...decks.map((deck) => ({
        id: deck.id,
        type: "flashcard" as const,
        title: deck.title,
        detail: `${deck._count.flashcards} flashcards`,
        href: `/flashcards?deck=${encodeURIComponent(deck.id)}`,
        updatedAt: deck.updatedAt.toISOString(),
      })),
      ...quizzes.map((quiz) => ({
        id: quiz.id,
        type: "quiz" as const,
        title: quiz.title,
        detail: `${quiz._count.questions} questions${quiz.isCompleted ? " - Completed" : ""}`,
        href: `/quizzes?quiz=${encodeURIComponent(quiz.id)}`,
        updatedAt: quiz.updatedAt.toISOString(),
      })),
      ...conversations.map((conversation) => ({
        id: conversation.id,
        type: "conversation" as const,
        title: conversation.title ?? "Untitled conversation",
        detail: "AI conversation",
        href: `/ai-assistant#conversation=${encodeURIComponent(conversation.id)}`,
        updatedAt: conversation.updatedAt.toISOString(),
      })),
    ]
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime(),
      )
      .slice(0, 10);

    return NextResponse.json(
      { results },
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

    console.error("[Dashboard Search API] Search failed:", error);
    return NextResponse.json(
      { message: "Search could not be completed." },
      { status: 500 },
    );
  }
}
