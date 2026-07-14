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

const DEFAULT_TIME_ZONE = "UTC";
const LOOKBACK_DAYS = 364;
const QUERY_BUFFER_DAYS = 2;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const dateFormattersByTimeZone = new Map<string, Intl.DateTimeFormat>();

function normalizeTimeZone(timeZone?: string): string {
  if (!timeZone) {
    return DEFAULT_TIME_ZONE;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

function getDateFormatter(timeZone: string): Intl.DateTimeFormat {
  const existingFormatter = dateFormattersByTimeZone.get(timeZone);

  if (existingFormatter) {
    return existingFormatter;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  dateFormattersByTimeZone.set(timeZone, formatter);

  return formatter;
}

function formatDateKeyInTimeZone(date: Date, timeZone: string): string {
  const parts = getDateFormatter(timeZone).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to format date key.");
  }

  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getUTCDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
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

export async function getHeatmapData(
  timeZone?: string,
): Promise<HeatmapDataResult> {
  const userId = await getCurrentUserId();
  const userTimeZone = normalizeTimeZone(timeZone);
  const now = new Date();
  const todayKey = formatDateKeyInTimeZone(now, userTimeZone);
  const startKey = addDaysToDateKey(todayKey, -LOOKBACK_DAYS);
  const queryStartDate = new Date(
    now.getTime() - (LOOKBACK_DAYS + QUERY_BUFFER_DAYS) * MILLISECONDS_PER_DAY,
  );

  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      createdAt: {
        gte: queryStartDate,
        lte: now,
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
    const dateKey = formatDateKeyInTimeZone(session.createdAt, userTimeZone);

    if (dateKey < startKey || dateKey > todayKey) {
      return;
    }

    const currentPoints = pointsByDate.get(dateKey) ?? 0;

    pointsByDate.set(dateKey, currentPoints + session.points);
  });

  const heatmapData = Array.from(pointsByDate.entries())
    .map(([date, count]) => ({
      date,
      count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const stats = calculateHeatmapStats(heatmapData, todayKey);

  return {
    heatmapData,
    stats,
  };
}
