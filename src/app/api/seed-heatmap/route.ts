import { NextRequest, NextResponse } from "next/server";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { message: "Bu rota sadece geliştirme ortamında kullanılabilir." },
      { status: 403 },
    );
  }

  try {
    let userId: string | null = null;

    try {
      userId = await getUserIdFromRequest(request);
    } catch (error) {
      if (!(error instanceof AuthError)) {
        throw error;
      }
    }

    if (!userId) {
      const firstUser = await prisma.user.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      userId = firstUser?.id ?? null;
    }

    if (!userId) {
      return NextResponse.json(
        { message: "Test verisi oluşturmak için kullanıcı bulunamadı." },
        { status: 404 },
      );
    }

    const sessions = [];

    for (let dayOffset = 0; dayOffset < 365; dayOffset += 1) {
      if (Math.random() < 0.3) {
        continue;
      }

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - dayOffset);
      createdAt.setHours(12, 0, 0, 0);

      sessions.push({
        userId,
        actionType: "SEED_TEST",
        points: Math.floor(Math.random() * 140) + 1,
        durationMinutes: 0,
        createdAt,
      });
    }

    try {
      await prisma.studySession.createMany({
        data: sessions,
      });
    } catch {
      await Promise.all(
        sessions.map((session) =>
          prisma.studySession.create({
            data: session,
          }),
        ),
      );
    }

    return NextResponse.json({
      message: "Test verileri başarıyla oluşturuldu",
      createdCount: sessions.length,
    });
  } catch (error) {
    console.error("[Seed Heatmap API] Test verisi oluşturulamadı:", error);

    return NextResponse.json(
      { message: "Test verileri oluşturulurken hata oluştu." },
      { status: 500 },
    );
  }
}
