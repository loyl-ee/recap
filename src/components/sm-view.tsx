import { db } from "@/db";
import { rm, sm, store } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SignOutButton } from "@/components/sign-out-button";
import { PromptCard } from "@/components/prompt-card";
import { RecapForm } from "@/components/recap-form";
import { PatternFlag } from "@/components/pattern-flag";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getSmContext,
  getTemplateQuestions,
  getCurrentRecap,
  getRecapAnswers,
  getPastRecaps,
  getPromptRules,
} from "@/app/actions/recap";
import { generatePrompt } from "@/lib/prompts";
import { detectPatterns } from "@/lib/patterns";

export async function SmView() {
  const { sm: smRecord, store: storeRecord } = await getSmContext();

  // Find the RM for this store's region to get prompt rules
  const [rmRecord] = await db
    .select()
    .from(rm)
    .where(eq(rm.regionId, storeRecord.regionId))
    .limit(1);

  // Load all data in parallel
  const [questions, currentRecap, pastRecaps, rules] = await Promise.all([
    getTemplateQuestions(storeRecord.id, smRecord.id),
    getCurrentRecap(smRecord.id, storeRecord.id),
    getPastRecaps(smRecord.id),
    rmRecord ? getPromptRules(rmRecord.id) : Promise.resolve([]),
  ]);

  // Get existing answers if there's a current recap
  const existingAnswers = currentRecap
    ? await getRecapAnswers(currentRecap.id)
    : [];

  // Detect patterns from past recaps
  const patterns = detectPatterns(pastRecaps);

  // Generate the prompt
  const weekEnding = new Date();
  const day = weekEnding.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  weekEnding.setDate(weekEnding.getDate() + daysUntilSunday);
  const weekEndingStr = weekEnding.toISOString().split("T")[0];

  const prompt = generatePrompt(
    storeRecord.name,
    weekEndingStr,
    questions,
    rules,
    patterns
  );

  return (
    <main className="flex-1 px-8 py-8 max-w-4xl mx-auto w-full">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1>My Recap</h1>
          <p className="text-muted-foreground mt-1">
            {storeRecord.name} &mdash; Week ending {weekEndingStr}
          </p>
        </div>
        <SignOutButton />
      </header>

      {/* Pattern flags */}
      {patterns.length > 0 && (
        <div className="mb-6 space-y-2">
          {patterns.map((p) => (
            <PatternFlag key={p.theme} pattern={p} />
          ))}
        </div>
      )}

      {/* Generated prompt */}
      <div className="mb-6">
        <PromptCard prompt={prompt} />
      </div>

      {/* Recap entry form */}
      <div className="mb-10">
        <RecapForm
          smId={smRecord.id}
          storeId={storeRecord.id}
          questions={questions}
          existingAnswers={existingAnswers.map((a) => ({
            questionId: a.questionId,
            answerText: a.answerText,
          }))}
          currentStatus={currentRecap?.status ?? null}
        />
      </div>

      {/* Past recaps */}
      <Separator className="mb-8" />
      <div>
        <h2 className="mb-4">Past Recaps</h2>
        {pastRecaps.length === 0 ? (
          <p className="text-muted-foreground">No past recaps yet.</p>
        ) : (
          <div className="space-y-4">
            {pastRecaps.map((r) => (
              <Card key={r.id} className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Week ending {r.weekEnding}
                    </CardTitle>
                    <Badge
                      variant={
                        r.status === "submitted" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {r.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {r.answers.map((a, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        {a.questionText}
                      </p>
                      <p className="text-sm">{a.answerText || "—"}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
