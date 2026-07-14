"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { revalidatePath } from "next/cache";
import { awardXp, calculatePomodoroXp, XP_RULES } from "@/lib/xp";

export type FocusSessionMode = "focus" | "deepWork";

export interface RecordFocusSessionInput {
  mode: FocusSessionMode;
  durationSeconds: number;
}

export type RecordFocusSessionResult =
  | {
      success: true;
      awardedPoints: number;
      dailyLimit: number;
      remainingBeforeAward: number;
      capped: boolean;
      durationMinutes: number;
    }
  | {
      success: false;
      error: string;
    };

async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized.");
  }

  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const secret = new TextEncoder().encode(jwtSecret);
  const { payload } = await jwtVerify(token, secret);
  const userId = payload.id;

  if (typeof userId !== "string" || !userId) {
    throw new Error("Invalid token payload.");
  }

  return userId;
}

export async function recordFocusSession(
  input: RecordFocusSessionInput,
): Promise<RecordFocusSessionResult> {
  try {
    const userId = await getCurrentUserId();

    if (input.mode !== "focus" && input.mode !== "deepWork") {
      return {
        success: false,
        error: "Only focus Pomodoro sessions can be recorded.",
      };
    }

    if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) {
      return {
        success: false,
        error: "Invalid session duration.",
      };
    }

    const durationMinutes = Math.max(1, Math.round(input.durationSeconds / 60));
    const rule = XP_RULES.POMODORO_FOCUS;
    const xp = await awardXp({
      userId,
      actionType: "POMODORO_FOCUS",
      points: calculatePomodoroXp(durationMinutes),
      dailyLimit: rule.dailyLimit,
      durationMinutes,
    });

    revalidatePath("/focus-zone");

    return {
      success: true,
      awardedPoints: xp.awardedPoints,
      dailyLimit: xp.dailyLimit,
      remainingBeforeAward: xp.remainingBeforeAward,
      capped: xp.capped,
      durationMinutes,
    };
  } catch (error) {
    console.error("[Focus Session] Could not record session:", error);

    return {
      success: false,
      error: "Focus session could not be recorded.",
    };
  }
}
