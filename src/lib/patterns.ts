export type PatternFlag = {
  theme: string;
  occurrences: number;
  weeks: string[];
};

type PastRecap = {
  weekEnding: string;
  answers: { questionText: string; answerText: string | null }[];
};

// Common theme keywords to look for in answers
const THEME_KEYWORDS: Record<string, string[]> = {
  "team fatigue / energy": [
    "tired",
    "fatigue",
    "exhausted",
    "worn out",
    "burnout",
    "low energy",
    "long hours",
    "wearing down",
  ],
  "staffing / scheduling": [
    "short staffed",
    "understaffed",
    "scheduling",
    "coverage",
    "call out",
    "no show",
    "overtime",
  ],
  "conversion rate": [
    "conversion",
    "close rate",
    "struggling to close",
    "traffic but",
    "not converting",
  ],
  "team morale": [
    "morale",
    "motivation",
    "disengaged",
    "frustrated",
    "unhappy",
    "turnover",
  ],
  "inventory issues": [
    "out of stock",
    "stockout",
    "inventory",
    "replenishment",
    "back stock",
    "missing sizes",
  ],
  "training needs": [
    "training",
    "onboarding",
    "new hire",
    "skill gap",
    "coaching",
    "development",
  ],
};

export function detectPatterns(
  pastRecaps: PastRecap[],
  minOccurrences = 2
): PatternFlag[] {
  const themeOccurrences: Record<string, Set<string>> = {};

  for (const recapData of pastRecaps) {
    // Combine all answer text for this week
    const allText = recapData.answers
      .map((a) => a.answerText ?? "")
      .join(" ")
      .toLowerCase();

    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      const found = keywords.some((kw) => allText.includes(kw));
      if (found) {
        if (!themeOccurrences[theme]) {
          themeOccurrences[theme] = new Set();
        }
        themeOccurrences[theme].add(recapData.weekEnding);
      }
    }
  }

  // Return themes that appear in >= minOccurrences different weeks
  const flags: PatternFlag[] = [];
  for (const [theme, weeks] of Object.entries(themeOccurrences)) {
    if (weeks.size >= minOccurrences) {
      const sortedWeeks = Array.from(weeks).sort();
      flags.push({
        theme,
        occurrences: weeks.size,
        weeks: sortedWeeks,
      });
    }
  }

  // Sort by occurrences descending
  flags.sort((a, b) => b.occurrences - a.occurrences);

  return flags;
}
