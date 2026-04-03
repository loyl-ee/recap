"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { saveRecapAnswers } from "@/app/actions/recap";

type Question = {
  question: {
    id: string;
    questionText: string;
    required: boolean;
  };
  templateName: string;
  templateType: string;
};

type ExistingAnswer = {
  questionId: string;
  answerText: string | null;
};

export function RecapForm({
  smId,
  storeId,
  questions,
  existingAnswers,
  currentStatus,
}: {
  smId: string;
  storeId: string;
  questions: Question[];
  existingAnswers: ExistingAnswer[];
  currentStatus: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<"draft" | "submitted" | null>(null);

  // Build initial answers map from existing data
  const answerMap = new Map<string, string>();
  for (const a of existingAnswers) {
    answerMap.set(a.questionId, a.answerText ?? "");
  }
  const [answers, setAnswers] = useState<Map<string, string>>(answerMap);

  function updateAnswer(questionId: string, value: string) {
    setAnswers((prev) => {
      const next = new Map(prev);
      next.set(questionId, value);
      return next;
    });
  }

  function handleSave(status: "draft" | "submitted") {
    startTransition(async () => {
      const answerEntries = questions.map((q) => ({
        questionId: q.question.id,
        answerText: answers.get(q.question.id) ?? "",
      }));
      await saveRecapAnswers(smId, storeId, answerEntries, status);
      setSaved(status);
      setTimeout(() => setSaved(null), 2000);
    });
  }

  const standardQuestions = questions.filter(
    (q) => q.templateType === "standard"
  );
  const specificQuestions = questions.filter(
    (q) => q.templateType !== "standard"
  );

  const isSubmitted = currentStatus === "submitted";

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">This Week&apos;s Recap</CardTitle>
        {currentStatus && (
          <Badge
            variant={isSubmitted ? "default" : "secondary"}
            className="text-xs"
          >
            {currentStatus}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {standardQuestions.length > 0 && (
          <div className="space-y-5">
            {standardQuestions.map((q, i) => (
              <div key={q.question.id} className="space-y-2">
                <Label
                  htmlFor={q.question.id}
                  className="text-sm font-medium leading-snug"
                >
                  {i + 1}. {q.question.questionText}
                  {q.question.required && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Textarea
                  id={q.question.id}
                  value={answers.get(q.question.id) ?? ""}
                  onChange={(e) => updateAnswer(q.question.id, e.target.value)}
                  rows={3}
                  className="resize-y min-h-[80px]"
                  disabled={isSubmitted}
                />
              </div>
            ))}
          </div>
        )}

        {specificQuestions.length > 0 && (
          <>
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Additional Focus Areas
              </p>
              <div className="space-y-5">
                {specificQuestions.map((q, i) => (
                  <div key={q.question.id} className="space-y-2">
                    <Label
                      htmlFor={q.question.id}
                      className="text-sm font-medium leading-snug"
                    >
                      {i + 1}. {q.question.questionText}
                      {q.question.required && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </Label>
                    <Textarea
                      id={q.question.id}
                      value={answers.get(q.question.id) ?? ""}
                      onChange={(e) =>
                        updateAnswer(q.question.id, e.target.value)
                      }
                      rows={3}
                      className="resize-y min-h-[80px]"
                      disabled={isSubmitted}
                    />
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!isSubmitted && (
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleSave("draft")}
              disabled={isPending}
              className="h-11 px-6 font-semibold"
            >
              {isPending ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={() => handleSave("submitted")}
              disabled={isPending}
              className="h-11 px-6 font-semibold"
            >
              {isPending ? "Submitting..." : "Submit Recap"}
            </Button>
            {saved && (
              <span className="text-sm text-muted-foreground">
                {saved === "draft" ? "Draft saved" : "Submitted!"}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
