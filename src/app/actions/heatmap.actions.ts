"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import {
  calculateHeatmapStats,
  type HeatmapStats,
} from "@/lib/utils/statistics";

export type HeatmapDataPoint = {
  date: string;
  count: number;
};

export type HeatmapDataResult = {
  heatmapData: HeatmapDataPoint[];
  stats: HeatmapStats;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

export async function getHeatmapData(): Promise<HeatmapDataResult> {
  const userId = await getCurrentUserId();
  const today = startOfDay(new Date());
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);

  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);

  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      createdAt: true,
      points: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const pointsByDate = new Map<string, number>();

  sessions.forEach((session) => {
    const dateKey = formatDateKey(session.createdAt);
    const currentPoints = pointsByDate.get(dateKey) ?? 0;

    pointsByDate.set(dateKey, currentPoints + session.points);
  });

  const heatmapData = Array.from(pointsByDate.entries()).map(([date, count]) => ({
    date,
    count,
  }));
  const stats = calculateHeatmapStats(heatmapData);

  return {
    heatmapData,
    stats,
  };
}
