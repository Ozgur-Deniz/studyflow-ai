export type HeatmapDataPoint = {
  date: string;
  count: number;
};

export type HeatmapStats = {
  totalPoints: number;
  mostActiveDay: {
    date: string | null;
    count: number;
  };
  currentStreak: number;
  longestStreak: number;
};

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}

export function calculateHeatmapStats(
  data: HeatmapDataPoint[],
  referenceDateKey = formatDateKey(new Date()),
): HeatmapStats {
  const pointsByDate = new Map<string, number>();

  data.forEach((item) => {
    pointsByDate.set(item.date, (pointsByDate.get(item.date) ?? 0) + item.count);
  });

  const sortedDays = Array.from(pointsByDate.entries())
    .map(([date, count]) => ({
      date,
      count,
      dateObject: parseDateKey(date),
    }))
    .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());

  const totalPoints = sortedDays.reduce((total, day) => total + day.count, 0);
  const mostActiveDay = sortedDays.reduce(
    (currentMostActive, day) =>
      day.count > currentMostActive.count
        ? { date: day.date, count: day.count }
        : currentMostActive,
    { date: null, count: 0 } as HeatmapStats["mostActiveDay"],
  );

  if (sortedDays.length === 0) {
    return {
      totalPoints,
      mostActiveDay,
      currentStreak: 0,
      longestStreak: 0,
    };
  }

  const firstDate = sortedDays[0].dateObject;
  const lastDate = sortedDays[sortedDays.length - 1].dateObject;
  let cursor = new Date(firstDate);
  let currentRun = 0;
  let longestStreak = 0;

  while (cursor <= lastDate) {
    const dateKey = formatDateKey(cursor);
    const count = pointsByDate.get(dateKey) ?? 0;

    if (count > 0) {
      currentRun += 1;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 0;
    }

    cursor = addDays(cursor, 1);
  }

  const yesterdayKey = formatDateKey(addDays(parseDateKey(referenceDateKey), -1));
  const currentStreakEnd =
    (pointsByDate.get(referenceDateKey) ?? 0) > 0
      ? parseDateKey(referenceDateKey)
      : (pointsByDate.get(yesterdayKey) ?? 0) > 0
        ? parseDateKey(yesterdayKey)
        : null;

  let currentStreak = 0;

  if (currentStreakEnd) {
    cursor = new Date(currentStreakEnd);

    while ((pointsByDate.get(formatDateKey(cursor)) ?? 0) > 0) {
      currentStreak += 1;
      cursor = addDays(cursor, -1);
    }
  }

  return {
    totalPoints,
    mostActiveDay,
    currentStreak,
    longestStreak,
  };
}
