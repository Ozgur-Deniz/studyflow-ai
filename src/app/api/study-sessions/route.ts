import { NextRequest, NextResponse } from "next/server";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { awardXp, calculatePomodoroXp, XP_RULES } from "@/lib/xp";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = (await request.json()) as {
      actionType?: unknown;
      durationSeconds?: unknown;
    };

    if (body.actionType !== "POMODORO_FOCUS") {
      return NextResponse.json(
        { message: "Unsupported study session action." },
        { status: 400 },
      );
    }

    const durationSeconds =
      typeof body.durationSeconds === "number" &&
      Number.isFinite(body.durationSeconds) &&
      body.durationSeconds > 0
        ? body.durationSeconds
        : XP_RULES.POMODORO_FOCUS.durationMinutes * 60;
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const xp = await awardXp({
      userId,
      actionType: "POMODORO_FOCUS",
      points: calculatePomodoroXp(durationMinutes),
      dailyLimit: XP_RULES.POMODORO_FOCUS.dailyLimit,
      durationMinutes,
    });

    return NextResponse.json({ success: true, xp }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Study Sessions API] Error creating study session:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the study session." },
      { status: 500 },
    );
  }
}
