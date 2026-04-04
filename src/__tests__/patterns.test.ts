import { describe, it, expect } from "vitest";
import { detectPatterns } from "@/lib/patterns";

describe("detectPatterns", () => {
  it("detects recurring themes across weeks", () => {
    const recaps = [
      {
        weekEnding: "2026-03-15",
        answers: [
          { questionText: "Q1", answerText: "The team has been really tired lately. Low energy on the floor." },
        ],
      },
      {
        weekEnding: "2026-03-22",
        answers: [
          { questionText: "Q1", answerText: "Team fatigue continues. They are exhausted from long shifts." },
        ],
      },
      {
        weekEnding: "2026-03-29",
        answers: [
          { questionText: "Q1", answerText: "Great week, everyone is energized and performing well." },
        ],
      },
    ];

    const flags = detectPatterns(recaps);

    const fatigueFlag = flags.find((f) => f.theme === "team fatigue / energy");
    expect(fatigueFlag).toBeDefined();
    expect(fatigueFlag!.occurrences).toBe(2);
    expect(fatigueFlag!.weeks).toContain("2026-03-15");
    expect(fatigueFlag!.weeks).toContain("2026-03-22");
  });

  it("does not flag themes appearing only once", () => {
    const recaps = [
      {
        weekEnding: "2026-03-15",
        answers: [
          { questionText: "Q1", answerText: "Conversion rate is below target this week." },
        ],
      },
      {
        weekEnding: "2026-03-22",
        answers: [
          { questionText: "Q1", answerText: "Everything is great, no issues at all." },
        ],
      },
    ];

    const flags = detectPatterns(recaps);
    const conversionFlag = flags.find((f) => f.theme === "conversion rate");
    expect(conversionFlag).toBeUndefined();
  });

  it("detects multiple themes simultaneously", () => {
    const recaps = [
      {
        weekEnding: "2026-03-15",
        answers: [
          { questionText: "Q1", answerText: "Team is tired and conversion is struggling." },
          { questionText: "Q2", answerText: "We are short staffed this week." },
        ],
      },
      {
        weekEnding: "2026-03-22",
        answers: [
          { questionText: "Q1", answerText: "Still exhausted. Conversion not improving." },
          { questionText: "Q2", answerText: "Understaffed again, had to cover shifts." },
        ],
      },
    ];

    const flags = detectPatterns(recaps);

    expect(flags.length).toBeGreaterThanOrEqual(3);
    expect(flags.find((f) => f.theme === "team fatigue / energy")).toBeDefined();
    expect(flags.find((f) => f.theme === "conversion rate")).toBeDefined();
    expect(flags.find((f) => f.theme === "staffing / scheduling")).toBeDefined();
  });

  it("returns empty array for no recaps", () => {
    expect(detectPatterns([])).toEqual([]);
  });

  it("handles null answer text gracefully", () => {
    const recaps = [
      {
        weekEnding: "2026-03-15",
        answers: [{ questionText: "Q1", answerText: null }],
      },
      {
        weekEnding: "2026-03-22",
        answers: [{ questionText: "Q1", answerText: null }],
      },
    ];

    const flags = detectPatterns(recaps);
    expect(flags).toEqual([]);
  });

  it("sorts by occurrences descending", () => {
    const recaps = [
      {
        weekEnding: "2026-03-08",
        answers: [{ questionText: "Q1", answerText: "Team is tired. Conversion is low." }],
      },
      {
        weekEnding: "2026-03-15",
        answers: [{ questionText: "Q1", answerText: "Fatigue everywhere. Conversion still bad." }],
      },
      {
        weekEnding: "2026-03-22",
        answers: [{ questionText: "Q1", answerText: "The team is exhausted again." }],
      },
    ];

    const flags = detectPatterns(recaps);
    // Fatigue appears in 3 weeks, conversion in 2
    if (flags.length >= 2) {
      expect(flags[0].occurrences).toBeGreaterThanOrEqual(flags[1].occurrences);
    }
  });
});
