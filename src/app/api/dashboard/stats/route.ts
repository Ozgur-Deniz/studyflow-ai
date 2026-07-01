import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      console.warn("[Dashboard Stats API] Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    if (!userId) {
      return NextResponse.json(
        { message: "Invalid token payload." },
        { status: 400 },
      );
    }

    // 3. Prisma ile veritabanından istatistikleri çek
    const [activePlansCount, conversationsCount, sessionsAggr] =
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
      ]);

    const totalStudyHours = sessionsAggr._sum.duration || 0;

    // Frontend'e gönderilecek veri objesi
    const statsData = {
      activeStudyPlans: activePlansCount,
      aiConversations: conversationsCount,
      totalStudyHours: totalStudyHours,
      currentStreak: 0,
    };

    console.log(
      `[Dashboard Stats API] Stats successfully retrieved for user: ${userId}`,
    );
    return NextResponse.json({ stats: statsData }, { status: 200 });
  } catch (error) {
    console.error("[Dashboard Stats API] Internal server error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching dashboard statistics." },
      { status: 500 },
    );
  }
}
