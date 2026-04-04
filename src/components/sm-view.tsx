import { db } from "@/db";
import { rm } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SignOutButton } from "@/components/sign-out-button";
import { PromptCard } from "@/components/prompt-card";
import { RecapForm } from "@/components/recap-form";
import { PastRecapsList } from "@/components/past-recaps-list";
import { OtherStoresGrid } from "@/components/other-stores-grid";
import { Separator } from "@/components/ui/separator";
import {
  getSmContext,
  getTemplateQuestions,
  getCurrentRecap,
  getRecapAnswers,
  getPastRecaps,
  getPromptRules,
  getOtherStoreRecaps,
  getRegionStores,
} from "@/app/actions/recap";
import { getSmFeedbackNotes } from "@/app/actions/rm";
import { generatePrompt } from "@/lib/prompts";
import { detectPatterns } from "@/lib/patterns";
import { getCurrentWeekEnding } from "@/lib/utils/date";

export async function SmView() {
  const { sm: smRecord, store: storeRecord } = await getSmContext();

  const [rmRecord] = await db
    .select()
    .from(rm)
    .where(eq(rm.regionId, storeRecord.regionId))
    .limit(1);

  const [questions, currentRecap, pastRecaps, rules, otherRecaps, regionStores, feedbackNotes] =
    await Promise.all([
      getTemplateQuestions(storeRecord.id, smRecord.id),
      getCurrentRecap(smRecord.id, storeRecord.id),
      getPastRecaps(smRecord.id),
      rmRecord ? getPromptRules(rmRecord.id) : Promise.resolve([]),
      getOtherStoreRecaps(storeRecord.regionId, storeRecord.id),
      getRegionStores(storeRecord.regionId),
      getSmFeedbackNotes(smRecord.id),
    ]);

  const existingAnswers = currentRecap
    ? await getRecapAnswers(currentRecap.id)
    : [];

  const patterns = detectPatterns(pastRecaps);
  const weekEndingStr = getCurrentWeekEnding();
  const prompt = generatePrompt(storeRecord.name, weekEndingStr, questions, rules, patterns);

  const otherRecapsByStore = new Map(otherRecaps.map((r) => [r.storeId, r]));
  const otherStores = regionStores.filter((s) => s.id !== storeRecord.id);

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

      <div className="mb-6">
        <PromptCard prompt={prompt} />
      </div>

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

      {feedbackNotes.length > 0 && (
        <>
          <Separator className="mb-8" />
          <section className="mb-10" aria-label="RM feedback">
            <h2 className="mb-4">Notes from Your RM</h2>
            <div className="space-y-3">
              {feedbackNotes.map((fn) => (
                <div
                  key={fn.note.id}
                  className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-3"
                >
                  <p className="text-sm">{fn.note.noteText}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {fn.rmName} &mdash; Week ending {fn.weekEnding}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <Separator className="mb-8" />
      <section className="mb-10" aria-label="Past recaps">
        <h2 className="mb-4">My Past Recaps</h2>
        <PastRecapsList recaps={pastRecaps} />
      </section>

      <Separator className="mb-8" />
      <section aria-label="Other stores">
        <h2 className="mb-4">Other Stores</h2>
        <OtherStoresGrid stores={otherStores} recapsByStore={otherRecapsByStore} />
      </section>
    </main>
  );
}
