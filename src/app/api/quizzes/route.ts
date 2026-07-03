import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest, AuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);

    const quizzes = await prisma.quiz.findMany({
      where: {
        userId,
      },
      include: {
        questions: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ quizzes }, { status: 200 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Failed to fetch quizzes:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching quizzes." },
      { status: 500 },
    );
  }
}
