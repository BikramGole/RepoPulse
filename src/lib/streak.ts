export interface StreakStats {
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
  activeDaysCount: number;
  currentStreakStart: string | null;
  currentStreakEnd: string | null;
  longestStreakStart: string | null;
  longestStreakEnd: string | null;
}

export interface DayContribution {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export function calculateContributionLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export function computeStreakFromDays(
  days: Array<{ date: string; contributionCount: number }>
): { streak: StreakStats; flatDays: DayContribution[] } {
  // Sort days chronologically
  const sortedDays = [...days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let totalContributions = 0;
  let activeDaysCount = 0;

  const flatDays: DayContribution[] = sortedDays.map((d) => {
    totalContributions += d.contributionCount;
    if (d.contributionCount > 0) activeDaysCount++;
    return {
      date: d.date,
      count: d.contributionCount,
      level: calculateContributionLevel(d.contributionCount),
    };
  });

  let currentStreak = 0;
  let longestStreak = 0;
  let curStart: string | null = null;
  let curEnd: string | null = null;
  let longStart: string | null = null;
  let longEnd: string | null = null;

  let tempStreak = 0;
  let tempStart: string | null = null;

  for (let i = 0; i < flatDays.length; i++) {
    const day = flatDays[i];
    if (day.count > 0) {
      if (tempStreak === 0) {
        tempStart = day.date;
      }
      tempStreak++;

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
        longStart = tempStart;
        longEnd = day.date;
      }
    } else {
      tempStreak = 0;
      tempStart = null;
    }
  }

  // Calculate current streak from the tail (today or yesterday)
  // Look back from the last day
  const today = new Date().toISOString().split("T")[0];
  let lookingBack = true;
  for (let i = flatDays.length - 1; i >= 0 && lookingBack; i--) {
    const day = flatDays[i];
    // Allow today to have 0 if not finished yet, check yesterday
    if (i === flatDays.length - 1 && day.count === 0 && day.date === today) {
      continue;
    }

    if (day.count > 0) {
      currentStreak++;
      if (!curEnd) curEnd = day.date;
      curStart = day.date;
    } else {
      lookingBack = false;
    }
  }

  return {
    streak: {
      totalContributions,
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      activeDaysCount,
      currentStreakStart: curStart,
      currentStreakEnd: curEnd,
      longestStreakStart: longStart,
      longestStreakEnd: longEnd,
    },
    flatDays,
  };
}
