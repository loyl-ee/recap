type QuestionEntry = {
  question: { questionText: string };
  templateName: string;
  templateType: string;
};

type PromptRule = {
  ruleType: string;
  value: string;
};

type PatternFlag = {
  theme: string;
  occurrences: number;
  weeks: string[];
};

export function generatePrompt(
  storeName: string,
  weekEnding: string,
  questions: QuestionEntry[],
  rules: PromptRule[],
  patterns: PatternFlag[]
): string {
  const lines: string[] = [];

  lines.push(`Weekly Recap — ${storeName}`);
  lines.push(`Week ending: ${weekEnding}`);
  lines.push("");

  // Add RM themes/directions
  const themes = rules.filter((r) => r.ruleType === "theme");
  if (themes.length > 0) {
    lines.push("DIRECTION FROM YOUR REGIONAL MANAGER:");
    for (const t of themes) {
      lines.push(`• ${t.value}`);
    }
    lines.push("");
  }

  // Add pattern awareness
  if (patterns.length > 0) {
    lines.push("RECURRING THEMES FROM YOUR PAST RECAPS:");
    for (const p of patterns) {
      lines.push(
        `⚠ "${p.theme}" — mentioned ${p.occurrences} times over the last ${p.weeks.length} weeks (${p.weeks.join(", ")})`
      );
    }
    lines.push(
      "Consider: Has the situation changed? Is this an ongoing issue that needs escalation?"
    );
    lines.push("");
  }

  // Standard questions
  const standard = questions.filter((q) => q.templateType === "standard");
  if (standard.length > 0) {
    lines.push("QUESTIONS TO ADDRESS:");
    for (let i = 0; i < standard.length; i++) {
      lines.push(`${i + 1}. ${standard[i].question.questionText}`);
    }
    lines.push("");
  }

  // Store/SM-specific questions
  const specific = questions.filter((q) => q.templateType !== "standard");
  if (specific.length > 0) {
    lines.push("ADDITIONAL FOCUS AREAS FOR YOUR STORE:");
    for (let i = 0; i < specific.length; i++) {
      lines.push(`${i + 1}. ${specific[i].question.questionText}`);
    }
    lines.push("");
  }

  lines.push(
    "Please answer each question with specific details, metrics where possible, and honest reflection."
  );

  return lines.join("\n");
}
