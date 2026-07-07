import { prisma } from "@/lib/prisma";

export const XP_RULES = {
  POMODORO_FOCUS: {
    points: 25,
    dailyLimit: 200,
    durationMinutes: 25,
  },
  QUIZ_COMPLETED_BASE: {
    points: 10,
    dailyLimit: 120,
    durationMinutes: 0,
  },
  FLASHCARD_REVIEWED: {
    points: 1,
    dailyLimit: 60,
    durationMinutes: 0,
  },
  FLASHCARD_DECK_COMPLETED: {
    points: 10,
    dailyLimit: 30,
    durationMinutes: 0,
  },
  STUDY_PLAN_CREATED: {
    points: 5,
    dailyLimit: 15,
    durationMinutes: 0,
  },
  STUDY_PLAN_COMPLETED: {
    points: 40,
    dailyLimit: 80,
    durationMinutes: 0,
  },
  AI_MESSAGE_SENT: {
    points: 1,
    dailyLimit: 10,
    durationMinutes: 0,
  },
  AI_RESOURCE_GENERATED: {
    points: 5,
    dailyLimit: 20,
    durationMinutes: 0,
  },
} as const;

export type XpActionType = keyof typeof XP_RULES | "QUIZ_COMPLETED";

type AwardXpInput = {
  userId: string;
  actionType: XpActionType;
  points: number;
  dailyLimit: number;
  durationMinutes?: number;
};

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export async function awardXp({
  userId,
  actionType,
  points,
  dailyLimit,
  durationMinutes = 0,
}: AwardXpInput) {
  if (points <= 0 || dailyLimit <= 0) {
    return {
      awardedPoints: 0,
      dailyLimit,
      remainingBeforeAward: Math.max(0, dailyLimit),
      capped: true,
    };
  }

  const { start, end } = getTodayRange();
  const todaysPoints = await prisma.studySession.aggregate({
    _sum: {
      points: true,
    },
    where: {
      userId,
      actionType,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });
  const usedToday = todaysPoints._sum.points ?? 0;
  const remainingBeforeAward = Math.max(0, dailyLimit - usedToday);
  const awardedPoints = Math.min(points, remainingBeforeAward);

  if (awardedPoints <= 0) {
    return {
      awardedPoints: 0,
      dailyLimit,
      remainingBeforeAward,
      capped: true,
    };
  }

  await prisma.studySession.create({
    data: {
      userId,
      actionType,
      points: awardedPoints,
      durationMinutes,
    },
  });

  return {
    awardedPoints,
    dailyLimit,
    remainingBeforeAward,
    capped: awardedPoints < points,
  };
}

export async function awardFixedXp(
  userId: string,
  actionType: Exclude<XpActionType, "QUIZ_COMPLETED">,
) {
  const rule = XP_RULES[actionType];

  return awardXp({
    userId,
    actionType,
    points: rule.points,
    dailyLimit: rule.dailyLimit,
    durationMinutes: rule.durationMinutes,
  });
}

export async function awardQuizCompletedXp({
  userId,
  correctAnswers,
}: {
  userId: string;
  correctAnswers: number;
}) {
  return awardXp({
    userId,
    actionType: "QUIZ_COMPLETED",
    points: XP_RULES.QUIZ_COMPLETED_BASE.points + Math.max(0, correctAnswers) * 4,
    dailyLimit: XP_RULES.QUIZ_COMPLETED_BASE.dailyLimit,
    durationMinutes: 0,
  });
}
