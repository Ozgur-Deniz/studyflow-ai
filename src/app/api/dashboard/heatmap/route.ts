import { NextRequest, NextResponse } from "next/server";
import { AuthError, getUserIdFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateHeatmapStats } from "@/lib/utils/statistics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEFAULT_TIME_ZONE = "UTC";
const LOOKBACK_DAYS = 364;
const QUERY_BUFFER_DAYS = 2;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const dateFormattersByTimeZone = new Map<string, Intl.DateTimeFormat>();

function normalizeTimeZone(timeZone?: string | null): string {
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

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    const userTimeZone = normalizeTimeZone(
      request.nextUrl.searchParams.get("timeZone"),
    );
    const now = new Date();
    const todayKey = formatDateKeyInTimeZone(now, userTimeZone);
    const startKey = addDaysToDateKey(todayKey, -LOOKBACK_DAYS);
    const queryStartDate = new Date(
      now.getTime() -
        (LOOKBACK_DAYS + QUERY_BUFFER_DAYS) * MILLISECONDS_PER_DAY,
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

      pointsByDate.set(dateKey, (pointsByDate.get(dateKey) ?? 0) + session.points);
    });

    const heatmapData = Array.from(pointsByDate.entries())
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const stats = calculateHeatmapStats(heatmapData, todayKey);

    return NextResponse.json(
      {
        heatmapData,
        stats,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error("[Dashboard Heatmap API] Internal server error:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching heatmap data." },
      { status: 500 },
    );
  }
}
