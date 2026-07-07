import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { awardQuizCompletedXp } from "@/lib/xp";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { id: quizId } = await params;
    const body = (await request.json()) as {
      isCompleted?: unknown;
      score?: unknown;
    };

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
      select: {
        id: true,
        isCompleted: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found." }, { status: 404 });
    }

    const updatedQuiz = await prisma.quiz.update({
      where: {
        id: quizId,
      },
      data: {
        isCompleted:
          typeof body.isCompleted === "boolean" ? body.isCompleted : true,
        score:
          typeof body.score === "number" && Number.isFinite(body.score)
            ? body.score
            : undefined,
      },
      include: {
        questions: true,
      },
    });
    const isMarkingCompleted =
      typeof body.isCompleted === "boolean" ? body.isCompleted : true;
    const correctAnswers =
      typeof body.score === "number" && Number.isFinite(body.score)
        ? body.score
        : 0;

    if (!quiz.isCompleted && isMarkingCompleted) {
      await awardQuizCompletedXp({
        userId,
        correctAnswers,
      });
    }

    return NextResponse.json(
      { success: true, quiz: updatedQuiz },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Quiz Detail API] Error updating quiz:", error);
    return NextResponse.json(
      { message: "An error occurred while updating the quiz." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { id: quizId } = await params;

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
      select: {
        id: true,
        isCompleted: true,
      },
    });

    if (!quiz) {
      return NextResponse.json({ message: "Quiz not found." }, { status: 404 });
    }

    if (!quiz.isCompleted) {
      return NextResponse.json(
        { message: "Only completed quizzes can be deleted." },
        { status: 400 },
      );
    }

    await prisma.quiz.delete({
      where: {
        id: quizId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Quiz Detail API] Error deleting quiz:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting the quiz." },
      { status: 500 },
    );
  }
}
