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

  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

export function calculateHeatmapStats(data: HeatmapDataPoint[]): HeatmapStats {
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

  const todayKey = formatDateKey(new Date());
  const currentStreakEnd =
    (pointsByDate.get(todayKey) ?? 0) > 0
      ? parseDateKey(todayKey)
      : [...sortedDays]
          .reverse()
          .find((day) => day.count > 0)?.dateObject ?? null;

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
