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

  // System instruction — tell the AI what it's doing
  lines.push(
    `You are a business writing assistant helping a store manager at ${storeName} write their weekly recap for the week ending ${weekEnding}.`
  );
  lines.push("");
  lines.push(
    "Your job is to walk me through each question below, one at a time. For each question, ask me what happened this week, then help me write a clear, specific, and concise answer. Push me for specifics — numbers, names, examples. Don't let me be vague."
  );
  lines.push("");
  lines.push(
    "Once we've gone through all the questions, compile my answers into a clean recap I can paste back into the system."
  );
  lines.push("");

  // Add RM themes/directions
  const themes = rules.filter((r) => r.ruleType === "theme");
  if (themes.length > 0) {
    lines.push("CONTEXT — My regional manager wants me to keep this in mind:");
    for (const t of themes) {
      lines.push(`• ${t.value}`);
    }
    lines.push(
      "Weave this direction into your follow-up questions where relevant."
    );
    lines.push("");
  }

  // Add pattern awareness
  if (patterns.length > 0) {
    lines.push(
      "HEADS UP — These themes have come up repeatedly in my past recaps:"
    );
    for (const p of patterns) {
      lines.push(
        `• "${p.theme}" — ${p.occurrences} times in the last ${p.weeks.length} weeks`
      );
    }
    lines.push("");
    lines.push(
      "When we get to related questions, challenge me on whether the situation has actually changed or if I'm repeating myself. If it's a real ongoing issue, help me frame it as something that needs escalation rather than just restating it."
    );
    lines.push("");
  }

  // Standard questions
  const standard = questions.filter((q) => q.templateType === "standard");
  if (standard.length > 0) {
    lines.push("QUESTIONS TO WALK ME THROUGH:");
    for (let i = 0; i < standard.length; i++) {
      lines.push(`${i + 1}. ${standard[i].question.questionText}`);
    }
    lines.push("");
  }

  // Store/SM-specific questions
  const specific = questions.filter((q) => q.templateType !== "standard");
  if (specific.length > 0) {
    lines.push("ADDITIONAL FOCUS AREAS SPECIFIC TO MY STORE:");
    for (let i = 0; i < specific.length; i++) {
      lines.push(
        `${standard.length + i + 1}. ${specific[i].question.questionText}`
      );
    }
    lines.push("");
  }

  lines.push(
    "Start with question 1. Ask me one question at a time. Keep it conversational."
  );

  return lines.join("\n");
}
