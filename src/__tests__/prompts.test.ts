import { describe, it, expect } from "vitest";
import { generatePrompt } from "@/lib/prompts";

describe("generatePrompt", () => {
  const baseQuestions = [
    {
      question: { questionText: "How did the week perform?" },
      templateName: "Weekly",
      templateType: "standard",
    },
    {
      question: { questionText: "What outperformed?" },
      templateName: "Weekly",
      templateType: "standard",
    },
  ];

  const storeQuestions = [
    {
      question: { questionText: "How is the new launch tracking?" },
      templateName: "Store Focus",
      templateType: "store_specific",
    },
  ];

  it("generates a prompt with system instruction", () => {
    const prompt = generatePrompt("Central Store", "2026-04-05", baseQuestions, [], []);

    expect(prompt).toContain("You are a business writing assistant");
    expect(prompt).toContain("Central Store");
    expect(prompt).toContain("2026-04-05");
    expect(prompt).toContain("walk me through each question");
  });

  it("includes all standard questions numbered", () => {
    const prompt = generatePrompt("Central Store", "2026-04-05", baseQuestions, [], []);

    expect(prompt).toContain("1. How did the week perform?");
    expect(prompt).toContain("2. What outperformed?");
  });

  it("includes store-specific questions separately", () => {
    const allQuestions = [...baseQuestions, ...storeQuestions];
    const prompt = generatePrompt("Central Store", "2026-04-05", allQuestions, [], []);

    expect(prompt).toContain("ADDITIONAL FOCUS AREAS SPECIFIC TO MY STORE");
    expect(prompt).toContain("3. How is the new launch tracking?");
  });

  it("includes RM themes when provided", () => {
    const rules = [
      { ruleType: "theme", value: "Focus on conversion this quarter." },
    ];
    const prompt = generatePrompt("Central Store", "2026-04-05", baseQuestions, rules, []);

    expect(prompt).toContain("CONTEXT — My regional manager");
    expect(prompt).toContain("Focus on conversion this quarter.");
    expect(prompt).toContain("Weave this direction");
  });

  it("includes pattern flags when provided", () => {
    const patterns = [
      { theme: "team fatigue", occurrences: 3, weeks: ["2026-03-15", "2026-03-22", "2026-03-29"] },
    ];
    const prompt = generatePrompt("Central Store", "2026-04-05", baseQuestions, [], patterns);

    expect(prompt).toContain("HEADS UP");
    expect(prompt).toContain("team fatigue");
    expect(prompt).toContain("3 times");
    expect(prompt).toContain("challenge me");
  });

  it("omits themes section when no rules", () => {
    const prompt = generatePrompt("Central Store", "2026-04-05", baseQuestions, [], []);

    expect(prompt).not.toContain("CONTEXT — My regional manager");
  });

  it("omits patterns section when no flags", () => {
    const prompt = generatePrompt("Central Store", "2026-04-05", baseQuestions, [], []);

    expect(prompt).not.toContain("HEADS UP");
  });

  it("ends with conversational instruction", () => {
    const prompt = generatePrompt("Central Store", "2026-04-05", baseQuestions, [], []);

    expect(prompt).toContain("Start with question 1");
    expect(prompt).toContain("one question at a time");
  });
});
