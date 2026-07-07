import { NextRequest, NextResponse } from "next/server";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { awardFixedXp } from "@/lib/xp";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const body = (await request.json()) as {
      actionType?: unknown;
    };

    if (body.actionType !== "POMODORO_FOCUS") {
      return NextResponse.json(
        { message: "Unsupported study session action." },
        { status: 400 },
      );
    }

    const xp = await awardFixedXp(userId, "POMODORO_FOCUS");

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
